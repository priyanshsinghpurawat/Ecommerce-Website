import { asyncHandler } from './asyncHandler.js';
import { ApiError } from './apiError.js';
import { ApiResponse } from './apiResponse.js';

export const createOne = (Model) =>
  asyncHandler(async (req, res) => {
    const doc = await Model.create(req.body);
    res.status(201).json(new ApiResponse(201, doc, 'Created successfully'));
  });

export const getOne = (Model, popOptions) =>
  asyncHandler(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;
    if (!doc) {
      return next(new ApiError(404, 'Document not found'));
    }
    res.status(200).json(new ApiResponse(200, doc, 'Fetched successfully'));
  });

export const getAll = (Model, defaultSort = '-createdAt') =>
  asyncHandler(async (req, res) => {
    // Simple pagination & sorting wrapper
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach((el) => delete queryObj[el]);

    let query = Model.find(queryObj);

    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort(defaultSort);
    }

    query = query.skip(skip).limit(limit);

    const doc = await query;
    const total = await Model.countDocuments(queryObj);

    res.status(200).json(
      new ApiResponse(
        200,
        { data: doc, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } },
        'Fetched successfully'
      )
    );
  });

export const updateOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return next(new ApiError(404, 'Document not found'));
    }
    res.status(200).json(new ApiResponse(200, doc, 'Updated successfully'));
  });

export const deleteOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new ApiError(404, 'Document not found'));
    }
    res.status(200).json(new ApiResponse(200, null, 'Deleted successfully'));
  });
