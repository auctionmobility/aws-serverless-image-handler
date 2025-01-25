// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { mockAwsS3 } from "../mock";

import S3 from "aws-sdk/clients/s3";

import { ImageRequest } from "../../image-request";
import { ImageHandlerError, RequestTypes, StatusCodes } from "../../lib";

describe("setup", () => {
  const OLD_ENV = process.env;
  const s3Client = new S3();

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env = OLD_ENV;
  });

  it("Should pass when a default image request is provided and populate the ImageRequest object with the proper values", async () => {
    // Arrange
    const event = {
      path: "/eyJidWNrZXQiOiJ2YWxpZEJ1Y2tldCIsImtleSI6InZhbGlkS2V5IiwiZWRpdHMiOnsiZ3JheXNjYWxlIjp0cnVlfSwib3V0cHV0Rm9ybWF0IjoianBlZyJ9",
    };
    process.env.SOURCE_BUCKETS = "validBucket, validBucket2";

    // Mock
    mockAwsS3.getObject.mockImplementationOnce(() => ({
      promise() {
        return Promise.resolve({ Body: Buffer.from("SampleImageContent\n") });
      },
    }));

    // Act
    const imageRequest = new ImageRequest(s3Client);
    const imageRequestInfo = await imageRequest.setup(event);
    const expectedResult = {
      requestType: "Default",
      bucket: "validBucket",
      key: "validKey",
      edits: { grayscale: true },
      outputFormat: "jpeg",
      originalImage: Buffer.from("SampleImageContent\n"),
      cacheControl: "max-age=31536000,public",
      contentType: "image/jpeg",
    };

    // Assert
    expect(mockAwsS3.getObject).toHaveBeenCalledWith({
      Bucket: "validBucket",
      Key: "validKey",
    });
    expect(imageRequestInfo).toEqual(expectedResult);
  });

  it("Should pass when a default image request is provided and populate the ImageRequest object with the proper values with UTF-8 key", async () => {
    // Arrange
    const event = {
      path: "eyJidWNrZXQiOiJ2YWxpZEJ1Y2tldCIsImtleSI6IuS4reaWhyIsImVkaXRzIjp7ImdyYXlzY2FsZSI6dHJ1ZX0sIm91dHB1dEZvcm1hdCI6ImpwZWcifQ==",
    };
    process.env = { SOURCE_BUCKETS: "validBucket, validBucket2" };

    // Mock
    mockAwsS3.getObject.mockImplementationOnce(() => ({
      promise() {
        return Promise.resolve({ Body: Buffer.from("SampleImageContent\n") });
      },
    }));

    // Act
    const imageRequest = new ImageRequest(s3Client);
    const imageRequestInfo = await imageRequest.setup(event);
    const expectedResult = {
      requestType: "Default",
      bucket: "validBucket",
      key: "中文",
      edits: { grayscale: true },
      outputFormat: "jpeg",
      originalImage: Buffer.from("SampleImageContent\n"),
      contentType: "image/jpeg",
    };

    // Assert
    expect(mockAwsS3.getObject).toHaveBeenCalledWith({
      Bucket: "validBucket",
      Key: "中文",
    });
    expect(imageRequestInfo).toMatchObject(expectedResult);
  });

  it("Should pass when a default image request is provided and populate the ImageRequest object with the proper values", async () => {
    // Arrange
    const event = {
      path: "/eyJidWNrZXQiOiJ2YWxpZEJ1Y2tldCIsImtleSI6InZhbGlkS2V5IiwiZWRpdHMiOnsidG9Gb3JtYXQiOiJwbmcifX0=",
    };
    process.env.SOURCE_BUCKETS = "validBucket, validBucket2";

    // Mock
    mockAwsS3.getObject.mockImplementationOnce(() => ({
      promise() {
        return Promise.resolve({ Body: Buffer.from("SampleImageContent\n") });
      },
    }));

    // Act
    const imageRequest = new ImageRequest(s3Client);
    const imageRequestInfo = await imageRequest.setup(event);
    const expectedResult = {
      requestType: "Default",
      bucket: "validBucket",
      key: "validKey",
      edits: { toFormat: "png" },
      outputFormat: "png",
      originalImage: Buffer.from("SampleImageContent\n"),
      cacheControl: "max-age=31536000,public",
      contentType: "image/png",
    };
    // Assert
    expect(mockAwsS3.getObject).toHaveBeenCalledWith({
      Bucket: "validBucket",
      Key: "validKey",
    });
    expect(imageRequestInfo).toEqual(expectedResult);
  });

  it("Should pass when a thumbor image request is provided and populate the ImageRequest object with the proper values", async () => {
    // Arrange
    const event = { path: "/filters:grayscale()/test-image-001.jpg" };
    process.env.SOURCE_BUCKETS = "allowedBucket001, allowedBucket002";

    // Mock
    mockAwsS3.getObject.mockImplementationOnce(() => ({
      promise() {
        return Promise.resolve({ Body: Buffer.from("SampleImageContent\n") });
      },
    }));

    // Act
    const imageRequest = new ImageRequest(s3Client);
    const imageRequestInfo = await imageRequest.setup(event);
    const expectedResult = {
      requestType: "Thumbor",
      bucket: "allowedBucket001",
      key: "test-image-001.jpg",
      edits: { grayscale: true },
      originalImage: Buffer.from("SampleImageContent\n"),
      cacheControl: "max-age=31536000,public",
      contentType: "image",
    };

    // Assert
    expect(mockAwsS3.getObject).toHaveBeenCalledWith({
      Bucket: "allowedBucket001",
      Key: "test-image-001.jpg",
    });
    expect(imageRequestInfo).toEqual(expectedResult);
  });

  it("Should pass when a thumbor image request is provided and populate the ImageRequest object with the proper values", async () => {
    // Arrange
    const event = {
      path: "/filters:format(png)/filters:quality(50)/test-image-001.jpg",
    };
    process.env.SOURCE_BUCKETS = "allowedBucket001, allowedBucket002";

    // Mock
    mockAwsS3.getObject.mockImplementationOnce(() => ({
      promise() {
        return Promise.resolve({ Body: Buffer.from("SampleImageContent\n") });
      },
    }));

    // Act
    const imageRequest = new ImageRequest(s3Client);
    const imageRequestInfo = await imageRequest.setup(event);
    const expectedResult = {
      requestType: "Thumbor",
      bucket: "allowedBucket001",
      key: "test-image-001.jpg",
      edits: {
        toFormat: "png",
        png: { quality: 50 },
      },
      originalImage: Buffer.from("SampleImageContent\n"),
      cacheControl: "max-age=31536000,public",
      outputFormat: "png",
      contentType: "image/png",
    };

    // Assert
    expect(mockAwsS3.getObject).toHaveBeenCalledWith({
      Bucket: "allowedBucket001",
      Key: "test-image-001.jpg",
    });
    expect(imageRequestInfo).toEqual(expectedResult);
  });

  it("Should pass when a custom image request is provided and populate the ImageRequest object with the proper values", async () => {
    // Arrange
    const event = {
      path: "/filters-rotate(90)/filters-grayscale()/custom-image.jpg",
    };
    process.env = {
      SOURCE_BUCKETS: "allowedBucket001, allowedBucket002",
      REWRITE_MATCH_PATTERN: "/(filters-)/gm",
      REWRITE_SUBSTITUTION: "filters:",
    };

    // Mock
    mockAwsS3.getObject.mockImplementationOnce(() => ({
      promise() {
        return Promise.resolve({
          CacheControl: "max-age=300,public",
          ContentType: "image/jpeg",
          Expires: "Tue, 24 Dec 2019 13:46:28 GMT",
          LastModified: "Sat, 19 Dec 2009 16:30:47 GMT",
          Body: Buffer.from("SampleImageContent\n"),
        });
      },
    }));

    // Act
    const imageRequest = new ImageRequest(s3Client);
    const imageRequestInfo = await imageRequest.setup(event);
    const expectedResult = {
      requestType: RequestTypes.CUSTOM,
      bucket: "allowedBucket001",
      key: "custom-image.jpg",
      edits: {
        grayscale: true,
        rotate: 90,
      },
      originalImage: Buffer.from("SampleImageContent\n"),
      cacheControl: "max-age=300,public",
      contentType: "image/jpeg",
      expires: "Tue, 24 Dec 2019 13:46:28 GMT",
      lastModified: "Sat, 19 Dec 2009 16:30:47 GMT",
    };

    // Assert
    expect(mockAwsS3.getObject).toHaveBeenCalledWith({
      Bucket: "allowedBucket001",
      Key: "custom-image.jpg",
    });
    expect(imageRequestInfo).toEqual(expectedResult);
  });

  it("Should pass when a custom image request is provided and populate the ImageRequest object with the proper values and no file extension", async () => {
    // Arrange
    const event = {
      path: "/filters-rotate(90)/filters-grayscale()/custom-image",
    };
    process.env = {
      SOURCE_BUCKETS: "allowedBucket001, allowedBucket002",
      REWRITE_MATCH_PATTERN: "/(filters-)/gm",
      REWRITE_SUBSTITUTION: "filters:",
    };

    // Mock
    mockAwsS3.getObject.mockImplementationOnce(() => ({
      promise() {
        return Promise.resolve({
          CacheControl: "max-age=300,public",
          ContentType: "image/jpeg",
          Expires: "Tue, 24 Dec 2019 13:46:28 GMT",
          LastModified: "Sat, 19 Dec 2009 16:30:47 GMT",
          Body: Buffer.from("SampleImageContent\n"),
        });
      },
    }));

    // Act
    const imageRequest = new ImageRequest(s3Client);
    const imageRequestInfo = await imageRequest.setup(event);
    const expectedResult = {
      requestType: RequestTypes.CUSTOM,
      bucket: "allowedBucket001",
      key: "custom-image",
      edits: {
        grayscale: true,
        rotate: 90,
      },
      originalImage: Buffer.from("SampleImageContent\n"),
      cacheControl: "max-age=300,public",
      contentType: "image/jpeg",
      expires: "Tue, 24 Dec 2019 13:46:28 GMT",
      lastModified: "Sat, 19 Dec 2009 16:30:47 GMT",
    };

    // Assert
    expect(mockAwsS3.getObject).toHaveBeenCalledWith({
      Bucket: "allowedBucket001",
      Key: "custom-image",
    });
    expect(imageRequestInfo).toEqual(expectedResult);
  });

  it("Should pass when an error is caught", async () => {
    // Arrange
    const event = {
      path: "/eyJidWNrZXQiOiJ2YWxpZEJ1Y2tldCIsImtleSI6InZhbGlkS2V5IiwiZWRpdHMiOnsiZ3JheXNjYWxlIjp0cnVlfX0=",
    };
    process.env.SOURCE_BUCKETS = "allowedBucket001, allowedBucket002";

    // Act
    const imageRequest = new ImageRequest(s3Client);

    // Assert
    try {
      await imageRequest.setup(event);
    } catch (error) {
      expect(error.code).toEqual("ImageBucket::CannotAccessBucket");
    }
  });

  describe("SVGSupport", () => {
    beforeAll(() => {
      process.env.ENABLE_SIGNATURE = "No";
      process.env.SOURCE_BUCKETS = "validBucket";
    });

    it("Should return SVG image when no edit is provided for the SVG image", async () => {
      // Arrange
      const event = {
        path: "/image.svg",
      };

      // Mock
      mockAwsS3.getObject.mockImplementationOnce(() => ({
        promise() {
          return Promise.resolve({
            ContentType: "image/svg+xml",
            Body: Buffer.from("SampleImageContent\n"),
          });
        },
      }));

      // Act
      const imageRequest = new ImageRequest(s3Client);
      const imageRequestInfo = await imageRequest.setup(event);
      const expectedResult = {
        requestType: "Thumbor",
        bucket: "validBucket",
        key: "image.svg",
        edits: {},
        originalImage: Buffer.from("SampleImageContent\n"),
        cacheControl: "max-age=31536000,public",
        contentType: "image/svg+xml",
      };

      // Assert
      expect(mockAwsS3.getObject).toHaveBeenCalledWith({
        Bucket: "validBucket",
        Key: "image.svg",
      });
      expect(imageRequestInfo).toEqual(expectedResult);
    });

    it("Should return WebP image when there are any edits and no output is specified for the SVG image", async () => {
      // Arrange
      const event = {
        path: "/100x100/image.svg",
      };

      // Mock
      mockAwsS3.getObject.mockImplementationOnce(() => ({
        promise() {
          return Promise.resolve({
            ContentType: "image/svg+xml",
            Body: Buffer.from("SampleImageContent\n"),
          });
        },
      }));

      // Act
      const imageRequest = new ImageRequest(s3Client);
      const imageRequestInfo = await imageRequest.setup(event);
      const expectedResult = {
        requestType: "Thumbor",
        bucket: "validBucket",
        key: "image.svg",
        edits: { resize: { width: 100, height: 100 } },
        outputFormat: "png",
        originalImage: Buffer.from("SampleImageContent\n"),
        cacheControl: "max-age=31536000,public",
        contentType: "image/png",
      };

      // Assert
      expect(mockAwsS3.getObject).toHaveBeenCalledWith({
        Bucket: "validBucket",
        Key: "image.svg",
      });
      expect(imageRequestInfo).toEqual(expectedResult);
    });

    it("Should return JPG image when output is specified to JPG for the SVG image", async () => {
      // Arrange
      const event = {
        path: "/filters:format(jpg)/image.svg",
      };

      // Mock
      mockAwsS3.getObject.mockImplementationOnce(() => ({
        promise() {
          return Promise.resolve({
            ContentType: "image/svg+xml",
            Body: Buffer.from("SampleImageContent\n"),
          });
        },
      }));

      // Act
      const imageRequest = new ImageRequest(s3Client);
      const imageRequestInfo = await imageRequest.setup(event);
      const expectedResult = {
        requestType: "Thumbor",
        bucket: "validBucket",
        key: "image.svg",
        edits: { toFormat: "jpeg" },
        outputFormat: "jpeg",
        originalImage: Buffer.from("SampleImageContent\n"),
        cacheControl: "max-age=31536000,public",
        contentType: "image/jpeg",
      };

      // Assert
      expect(mockAwsS3.getObject).toHaveBeenCalledWith({
        Bucket: "validBucket",
        Key: "image.svg",
      });
      expect(imageRequestInfo).toEqual(expectedResult);
    });
  });

  it("Should pass and return the customer headers if custom headers are provided", async () => {
    // Arrange
    const event = {
      path: "/eyJidWNrZXQiOiJ2YWxpZEJ1Y2tldCIsImtleSI6InZhbGlkS2V5IiwiaGVhZGVycyI6eyJDYWNoZS1Db250cm9sIjoibWF4LWFnZT0zMTUzNjAwMCxwdWJsaWMifSwib3V0cHV0Rm9ybWF0IjoianBlZyJ9",
    };
    process.env.SOURCE_BUCKETS = "validBucket, validBucket2";

    // Mock
    mockAwsS3.getObject.mockImplementationOnce(() => ({
      promise() {
        return Promise.resolve({ Body: Buffer.from("SampleImageContent\n") });
      },
    }));

    // Act
    const imageRequest = new ImageRequest(s3Client);
    const imageRequestInfo = await imageRequest.setup(event);
    const expectedResult = {
      requestType: "Default",
      bucket: "validBucket",
      key: "validKey",
      headers: { "Cache-Control": "max-age=31536000,public" },
      outputFormat: "jpeg",
      originalImage: Buffer.from("SampleImageContent\n"),
      cacheControl: "max-age=31536000,public",
      contentType: "image/jpeg",
    };

    // Assert
    expect(mockAwsS3.getObject).toHaveBeenCalledWith({
      Bucket: "validBucket",
      Key: "validKey",
    });
    expect(imageRequestInfo).toEqual(expectedResult);
  });

  it("Should pass when valid reduction effort is provided and output is webp", async () => {
    const event = {
      path: "/eyJidWNrZXQiOiJ0ZXN0Iiwia2V5IjoidGVzdC5wbmciLCJvdXRwdXRGb3JtYXQiOiJ3ZWJwIiwicmVkdWN0aW9uRWZmb3J0IjozfQ==",
    };
    process.env.SOURCE_BUCKETS = "test, validBucket, validBucket2";

    // Mock
    mockAwsS3.getObject.mockImplementationOnce(() => ({
      promise() {
        return Promise.resolve({ Body: Buffer.from("SampleImageContent\n") });
      },
    }));

    // Act
    const imageRequest = new ImageRequest(s3Client);
    const imageRequestInfo = await imageRequest.setup(event);
    const expectedResult = {
      requestType: "Default",
      bucket: "test",
      key: "test.png",
      edits: undefined,
      headers: undefined,
      outputFormat: "webp",
      originalImage: Buffer.from("SampleImageContent\n"),
      cacheControl: "max-age=31536000,public",
      contentType: "image/webp",
    };

    // Assert
    expect(mockAwsS3.getObject).toHaveBeenCalledWith({
      Bucket: "test",
      Key: "test.png",
    });
    expect(imageRequestInfo).toEqual(expectedResult);
  });

  it("Should pass and use default reduction effort if it is invalid type and output is webp", async () => {
    const event = {
      path: "/eyJidWNrZXQiOiJ0ZXN0Iiwia2V5IjoidGVzdC5wbmciLCJvdXRwdXRGb3JtYXQiOiJ3ZWJwIiwicmVkdWN0aW9uRWZmb3J0IjoidGVzdCJ9",
    };
    process.env.SOURCE_BUCKETS = "test, validBucket, validBucket2";

    // Mock
    mockAwsS3.getObject.mockImplementationOnce(() => ({
      promise() {
        return Promise.resolve({ Body: Buffer.from("SampleImageContent\n") });
      },
    }));

    // Act
    const imageRequest = new ImageRequest(s3Client);
    const imageRequestInfo = await imageRequest.setup(event);
    const expectedResult = {
      requestType: "Default",
      bucket: "test",
      key: "test.png",
      edits: undefined,
      headers: undefined,
      outputFormat: "webp",
      originalImage: Buffer.from("SampleImageContent\n"),
      cacheControl: "max-age=31536000,public",
      contentType: "image/webp",
    };

    // Assert
    expect(mockAwsS3.getObject).toHaveBeenCalledWith({
      Bucket: "test",
      Key: "test.png",
    });
    expect(imageRequestInfo).toEqual(expectedResult);
  });

  it("Should pass and use default reduction effort if it is out of range and output is webp", async () => {
    const event = {
      path: "/eyJidWNrZXQiOiJ0ZXN0Iiwia2V5IjoidGVzdC5wbmciLCJvdXRwdXRGb3JtYXQiOiJ3ZWJwIiwicmVkdWN0aW9uRWZmb3J0IjoxMH0=",
    };
    process.env.SOURCE_BUCKETS = "test, validBucket, validBucket2";

    // Mock
    mockAwsS3.getObject.mockImplementationOnce(() => ({
      promise() {
        return Promise.resolve({ Body: Buffer.from("SampleImageContent\n") });
      },
    }));

    // Act
    const imageRequest = new ImageRequest(s3Client);
    const imageRequestInfo = await imageRequest.setup(event);
    const expectedResult = {
      requestType: "Default",
      bucket: "test",
      key: "test.png",
      edits: undefined,
      headers: undefined,
      outputFormat: "webp",
      originalImage: Buffer.from("SampleImageContent\n"),
      cacheControl: "max-age=31536000,public",
      contentType: "image/webp",
    };

    // Assert
    expect(mockAwsS3.getObject).toHaveBeenCalledWith({
      Bucket: "test",
      Key: "test.png",
    });
    expect(imageRequestInfo).toEqual(expectedResult);
  });

  it("Should pass and not use reductionEffort if it is not provided and output is webp", async () => {
    const event = {
      path: "/eyJidWNrZXQiOiJ0ZXN0Iiwia2V5IjoidGVzdC5wbmciLCJvdXRwdXRGb3JtYXQiOiJ3ZWJwIn0=",
    };
    process.env.SOURCE_BUCKETS = "test, validBucket, validBucket2";

    // Mock
    mockAwsS3.getObject.mockImplementationOnce(() => ({
      promise() {
        return Promise.resolve({ Body: Buffer.from("SampleImageContent\n") });
      },
    }));

    // Act
    const imageRequest = new ImageRequest(s3Client);
    const imageRequestInfo = await imageRequest.setup(event);
    const expectedResult = {
      requestType: "Default",
      bucket: "test",
      key: "test.png",
      edits: undefined,
      headers: undefined,
      outputFormat: "webp",
      originalImage: Buffer.from("SampleImageContent\n"),
      cacheControl: "max-age=31536000,public",
      contentType: "image/webp",
    };

    // Assert
    expect(mockAwsS3.getObject).toHaveBeenCalledWith({
      Bucket: "test",
      Key: "test.png",
    });
    expect(imageRequestInfo).toEqual(expectedResult);
  });

  it('Should pass when a default image request is provided and populate the ImageRequest object with the proper values and a utf-8 key', async function () {
    // Arrange
    const event = {
      path: 'eyJidWNrZXQiOiJ0ZXN0Iiwia2V5Ijoi5Lit5paHIiwiZWRpdHMiOnsiZ3JheXNjYWxlIjp0cnVlfSwib3V0cHV0Rm9ybWF0IjoianBlZyJ9'
    }
    process.env = {
      SOURCE_BUCKETS: "test, test2"
    }
    // Mock
    mockAwsS3.getObject.mockImplementationOnce(() => {
      return {
        promise() {
          return Promise.resolve({ Body: Buffer.from('SampleImageContent\n') });
        }
      };
    });
    // Act
    const imageRequest = new ImageRequest(s3Client);
    const imageRequestInfo = await imageRequest.setup(event);
    const expectedResult = {
      requestType: 'Default',
      bucket: 'test',
      key: '中文',
      edits: { grayscale: true },
      headers: undefined,
      outputFormat: 'jpeg',
      originalImage: Buffer.from('SampleImageContent\n'),
      cacheControl: 'max-age=31536000,public',
      contentType: 'image/jpeg'
    };
    // Assert
    expect(mockAwsS3.getObject).toHaveBeenCalledWith({ Bucket: 'test', Key: '中文' });
    expect(imageRequestInfo).toEqual(expectedResult);
  });
});
