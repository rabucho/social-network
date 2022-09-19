import axios from 'axios';

const CLOUDINARY_UPLOAD_PRESET = 'uvm9hyxi';
const CLOUDINARY_UPLOAD_LINK =
  'https://api.cloudinary.com/v1_1/dw6bikqwf/image/upload';

interface UploadImageType {
  url: string;
  width: number;
  height: number;
}

const uploadImage = async (
  selectedImage: File,
  uploadProgressCalback?: (progress: number) => void
): Promise<UploadImageType> => {
  const formData = new FormData();
  formData.append('file', selectedImage);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await axios.post(CLOUDINARY_UPLOAD_LINK, formData, {
    onUploadProgress: (progressEvent) => {
      const percentageProgress =
        (progressEvent.loaded / progressEvent.total) * 100;
      if (uploadProgressCalback) {
        uploadProgressCalback(percentageProgress);
      }
    },
  });

  return {
    url: response.data.secure_url,
    width: response.data.width,
    height: response.data.height,
  };
};

export default uploadImage;
