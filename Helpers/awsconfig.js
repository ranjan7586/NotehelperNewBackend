const { S3Client, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const dotenv = require('dotenv');
dotenv.config({ path: "Backend/config/config.env" });

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadFile = async (file) => {
  console.log(file.buffer)
  if (!file.buffer || !file.originalname || !file.mimetype) {
    throw new Error('File object is missing required properties.');
  }

  const upload = new Upload({
    client: s3,
    params: {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${Date.now().toString()}_${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
    },
  });

  const data = await upload.done();
  // return `https://${data.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${data.Key}`;
  return data.Key;
};

const getPreSignedUrl = async (key) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // URL expires in 1 hour
  return url;
};

const deleteFile = async (fileUrl) => {
  const fileName = fileUrl.split('/').pop();
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
  };
  const command = new DeleteObjectCommand(params);
  await s3.send(command);
};


module.exports = { uploadFile, getPreSignedUrl, deleteFile };
