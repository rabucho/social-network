import { createProtectedRouter } from "./protected-router";
import { z } from "zod";
import { prisma } from "../db/client";

// Example router with queries that can only be hit if the user requesting is signed in
export const communityRouter = createProtectedRouter()
  .query("getAll", {
    async resolve({ input, ctx }) {
      const communities = await prisma.community.findMany({
        include: {
          _count: true,
          members: {
            select: {
              userId: true,
            },
          },
        },
      });

      return communities.map(({ _count, members, ...communityData }) => ({
        ...communityData,
        membersCount: _count.members,
        joinedByMe: members.some(
          (member) => member.userId === ctx.session.user.id
        ),
      }));
    },
  })
  .query("getById", {
    input: z.object({
      id: z.string(),
    }),
    async resolve({ ctx, input }) {
      const community = await prisma.community.findUniqueOrThrow({
        where: {
          id: input.id,
        },
        include: {
          _count: true,
        },
      });

      const member = await prisma.userCommunity.findUnique({
        where: {
          userId_communityId: {
            userId: ctx.session.user.id,
            communityId: input.id,
          },
        },
      });

      const { _count, ...communityData } = community;
      return {
        memebrsCount: _count.members,
        ...communityData,
        joinedByMe: !!member,
        isAdmin: member?.role === "ADMIN",
      };
    },
  })
  .query("getMembers", {
    input: z.object({
      communityId: z.string(),
    }),
    async resolve({ input }) {
      const memebrs = await prisma.user.findMany({
        where: {
          communities: {
            some: {
              communityId: input.communityId,
            },
          },
        },
        include: {
          _count: {
            select: {
              followedBy: true,
            },
          },
        },
      });
      return memebrs.map(({ _count, ...memberData }) => ({
        ...memberData,
        followersCount: _count.followedBy,
      }));
    },
  })
  .mutation("addCommunity", {
    input: z.object({
      name: z.string(),
    }),
    async resolve({ ctx, input }) {
      return await prisma.community.create({
        data: {
          name: input.name,
          members: {
            create: {
              role: "ADMIN",
              userId: ctx.session.user.id,
            },
          },
        },
      });
    },
  })
  .query("popular", {
    async resolve() {
      const data = await prisma.userCommunity.groupBy({
        by: ["communityId"],
        _count: {
          communityId: true,
          userId: true,
        },
        orderBy: {
          _count: {
            userId: "desc",
          },
        },
        take: 5,
      });

      const comminitiesIds = data.map(
        (userCommunity) => userCommunity.communityId
      );

      const comunitiesNames = await Promise.all(
        comminitiesIds.map((id) =>
          prisma.community.findFirstOrThrow({
            where: {
              id,
            },
            select: {
              name: true,
            },
          })
        )
      );

      return data.map(({ _count, ...userCommunityData }, index) => ({
        ...userCommunityData,
        communityName: comunitiesNames[index]?.name!,
        memebrsCount: _count.userId,
      }));
    },
  })
  .mutation("toggleMembership", {
    input: z.object({
      communityId: z.string(),
    }),
    async resolve({ input, ctx }) {
      const member = await prisma.userCommunity.findUnique({
        where: {
          userId_communityId: {
            userId: ctx.session.user.id,
            communityId: input.communityId,
          },
        },
      });

      if (member) {
        await prisma.userCommunity.delete({
          where: {
            userId_communityId: {
              communityId: input.communityId,
              userId: ctx.session.user.id,
            },
          },
        });
      } else {
        await prisma.userCommunity.create({
          data: {
            communityId: input.communityId,
            userId: ctx.session.user.id,
          },
        });
      }
    },
  })
  .mutation("update", {
    input: z.object({
      communityId: z.string(),
      name: z.string(),
      description: z.string(),
      image: z.string().optional(),
      bannerImage: z.string().optional(),
    }),
    async resolve({ ctx, input }) {
      const user = await prisma.userCommunity.findUnique({
        where: {
          userId_communityId: {
            communityId: input.communityId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (user?.role !== "ADMIN") {
        throw new Error("You dont have permissions to modify this community");
      }

      await prisma.community.update({
        where: {
          id: input.communityId,
        },
        data: {
          name: input.name,
          description: input.description,
          image: input.image,
          bannerImage: input.bannerImage,
        },
      });
    },
  });
