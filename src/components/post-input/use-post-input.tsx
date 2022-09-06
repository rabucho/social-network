import { useDropzone } from 'react-dropzone';
import { SubmitErrorHandler, useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import uploadImage from 'src/utils/cloudinary';
import { useAddPostMutation } from '@/hooks/mutation';
import { PostInputFormType } from './types';

const MAX_FILE_SIZE = 2097152;
const MAX_FILES_NUMBER = 4;

interface UsePostInputProps {
  submitCallback?: () => void;
  communityId?: string;
  sharedPostId?: string;
}

const usePostInput = ({
  submitCallback,
  communityId,
  sharedPostId,
}: UsePostInputProps) => {
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<PostInputFormType>({
    defaultValues: {
      content: '',
      tags: [],
      mentions: [],
      images: [],
      imagesUploadProgress: [],
      link: {
        isOpen: false,
        value: undefined,
      },
    },
  });

  const addPost = useAddPostMutation(submitCallback);

  const setImages = (files: File[]) => {
    const currentImages = getValues('images');

    if (files.length + currentImages.length > MAX_FILES_NUMBER) {
      toast('You can add up to 4 images', {
        type: 'error',
      });
    }

    let imagesToVerify = files.slice(
      0,
      MAX_FILES_NUMBER - currentImages.length
    );

    const isSomeImageSizeToBig = imagesToVerify.some(
      (image) => image.size > MAX_FILE_SIZE
    );

    if (isSomeImageSizeToBig) {
      toast('Image size cant exceed 2 Mb', {
        type: 'error',
      });
    }

    imagesToVerify = imagesToVerify.filter(
      (image) => image.size <= MAX_FILE_SIZE
    );

    setValue('images', [...getValues('images'), ...imagesToVerify]);
  };

  const selectedImages = watch('images');

  const {
    getRootProps,
    getInputProps,
    isDragActive: isImageDragged,
    open: openFilePicker,
  } = useDropzone({
    noClick: true,
    accept: {
      'image/*': ['.png', '.gif', '.jpeg', '.jpg'],
    },
    onDrop: (files: File[]) => {
      setImages(files);
      setValue(
        'imagesUploadProgress',
        Array(selectedImages.length + files.length).fill(0)
      );
    },
    validator: (file: File) => {
      if (getValues('images').some((image) => image.name === file.name)) {
        return {
          code: 'file-exists',
          message: `File with name ${file.name} was added already`,
        };
      }
      return null;
    },
  });

  const sumOfCurrentUploaded = watch('imagesUploadProgress').reduce(
    (sum, entry) => sum + entry,
    0
  );

  const finalUploadProgress = sumOfCurrentUploaded / selectedImages.length || 0;

  const onSubmit = async (data: PostInputFormType) => {
    const { content, images, link, mentions, tags } = data;

    const imageUrls = await Promise.all(
      images.map((file, index) =>
        uploadImage(file, (progress) => {
          const imagesUploadProgress = getValues('imagesUploadProgress');
          setValue(
            'imagesUploadProgress',
            imagesUploadProgress.map((val, i) => (i === index ? progress : val))
          );
        })
      )
    );

    addPost({
      content,
      images: imageUrls.length
        ? imageUrls.map((url) => ({ imageAlt: 'alt', imageUrl: url }))
        : null,
      tags,
      mentions: mentions.map((mention) => mention.id),
      shareParentId: sharedPostId,
      communityId,
      link: link.value,
    });

    reset();
  };

  const onError: SubmitErrorHandler<PostInputFormType> = (e) => {
    if (e.link) {
      toast('Provide valid link', {
        type: 'error',
      });
    }
  };

  const content = watch('content');

  const handleFormSubmit = handleSubmit(onSubmit, onError);

  const contentLength = content.trim().length;

  const isSubmitButtonEnabled = contentLength > 0 && contentLength <= 280;

  return {
    control,
    setValue,
    handleFormSubmit,
    getRootProps,
    isImageDragged,
    getInputProps,
    register,
    openFilePicker,
    finalUploadProgress,
    isSubmitButtonEnabled,
    errors,
    content,
  };
};

export default usePostInput;