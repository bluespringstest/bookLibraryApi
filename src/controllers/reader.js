import { Reader } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

// Helper function to remove sensitive data from reader object
const removeSensitiveData = (reader) => {
  if (!reader) return null;
  const readerData = reader.get({ plain: true });
  delete readerData.password;
  return readerData;
};

export const create = async (req, res) => {
  try {
    const reader = await Reader.create(req.body);
    const readerData = removeSensitiveData(reader);
    return successResponse(res, { reader: readerData }, 'Reader created successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export const read = async (_, res) => {
  try {
    const readers = await Reader.findAll();
    const readersData = readers.map(reader => removeSensitiveData(reader));
    return successResponse(res, { readers: readersData });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const readById = async (req, res) => {
  try {
    const reader = await Reader.findByPk(req.params.id);
    if (!reader) {
      throw new ApiError(404, 'Reader not found');
    }
    const readerData = removeSensitiveData(reader);
    return successResponse(res, { reader: readerData });
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

export const update = async (req, res) => {
  try {
    const reader = await Reader.findByPk(req.params.id);
    if (!reader) {
      throw new ApiError(404, 'Reader not found');
    }
    await reader.update(req.body);
    const readerData = removeSensitiveData(reader);
    return successResponse(res, { reader: readerData }, 'Reader updated successfully');
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

export const deleteReader = async (req, res) => {
  try {
    const reader = await Reader.findByPk(req.params.id);
    if (!reader) {
      throw new ApiError(404, 'Reader not found');
    }
    await reader.destroy();
    return successResponse(res, null, 'Reader deleted successfully', 204);
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};