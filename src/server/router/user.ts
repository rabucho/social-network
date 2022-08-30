import { createProtectedRouter } from "./protected-router";
import { z } from "zod";
import { prisma } from "../db/client";
import { SearchType } from "./types";

// Example router with queries that can only be hit if the user requesting is signed in
export const userRouter = createProtectedRouter()
  .query("getById", {
    input: z.object({
      userId: z.string(),
    }),
    async resolve({ input, ctx }) {
      const user = await prisma.user.findUnique({
        where: {
          id: input.userId,
        },
        include: {
          followedBy: true,
          _count: {
            select: {
              followedBy: true,
              following: true,
            },
          },
        },
      });

      if (!user) throw new Error("no user with id");

      const { _count, followedBy, ...userData } = user;

      return {
        ...userData,
        followingCount: _count.following,
        followedByCount: _count.followedBy,
        followedByMe: followedBy.find(
          (follower) => follower.id === ctx.session.user.id
        ),
      };
    },
  })
  .query("me", {
    async resolve({ ctx }) {
      return ctx.session.user;
    },
  })
  .query("getFollows", {
    input: z.object({
      userId: z.string(),
    }),
    async resolve({ input }) {
      const user = await prisma.user.findFirstOrThrow({
        where: {
          id: input.userId,
        },
        select: {
          following: {
            include: {
              _count: {
                select: {
                  followedBy: true,
                },
              },
            },
          },
          followedBy: {
            include: {
              _count: {
                select: {
                  followedBy: true,
                },
              },
            },
          },
        },
      });
      const { followedBy, following, ...userData } = user;

      return {
        ...userData,
        followedBy: followedBy.map(({ _count, ...data }) => ({
          ...data,
          followers: _count.followedBy,
        })),
        following: following.map(({ _count, ...data }) => ({
          ...data,
          followers: _count.followedBy,
        })),
      };
    },
  })
  .query("getBySearchPhrase", {
    input: z.object({
      searchPhrase: z.string(),
    }),

    async resolve({ input }) {
      const matchingUsers = await prisma.user.findMany({
        where: {
          name: {
            contains: input.searchPhrase,
          },
        },
        include: {
          _count: {
            select: {
              followedBy: true,
            },
          },
        },
        take: 5,
      });

      const matchingCommunities = await prisma.community.findMany({
        where: {
          name: {
            contains: input.searchPhrase,
          },
        },
        include: {
          _count: {
            select: {
              members: true,
            },
          },
        },
        take: 5,
      });

      const matchingUsersWithFollows = matchingUsers.map(
        ({ _count, id, name, image, ...userData }) => ({
          type: SearchType.USER,
          id,
          title: name,
          image: image,
          followersCount: _count.followedBy,
        })
      );

      const matchingCommunitiesWithFollows = matchingCommunities.map(
        ({ _count, id, name, image, ...comunityData }) => ({
          type: SearchType.COMMUNITY,
          id,
          title: name,
          image: image,
          followersCount: _count.members,
        })
      );

      return [...matchingUsersWithFollows, ...matchingCommunitiesWithFollows]
        .sort((a, b) => a.followersCount - b.followersCount)
        .slice(0, 5);
    },
  })
  .mutation("followUser", {
    input: z.object({
      userId: z.string(),
    }),

    async resolve({ ctx, input }) {
      if (input.userId === ctx.session.user.id) {
        throw new Error("U cant follow yourself");
      }

      const user = await prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
        select: {
          following: true,
        },
      });

      const isUserFollowed =
        user?.following.some((user) => user.id === input.userId) || false;

      await prisma.user.update({
        where: {
          id: ctx.session.user.id,
        },
        data: {
          following: isUserFollowed
            ? {
                disconnect: {
                  id: input.userId,
                },
              }
            : {
                connect: {
                  id: input.userId,
                },
              },
        },
      });
    },
  })
  .mutation("update", {
    input: z.object({
      name: z.string(),
      bio: z.string(),
      image: z.string().optional(),
      bannerImage: z.string().optional(),
    }),
    async resolve({ ctx, input }) {
      await prisma.user.update({
        where: {
          id: ctx.session.user.id,
        },
        data: {
          name: input.name,
          bio: input.bio,
          image: input.image,
          bannerImage: input.bannerImage,
        },
      });
    },
  });
