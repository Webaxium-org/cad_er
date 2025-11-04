import mongoose from 'mongoose';

const isValidObjectId = (id) => {
  if (!id) return false;
  if (typeof id === 'object' && id instanceof mongoose.Types.ObjectId)
    return true;
  return mongoose.Types.ObjectId.isValid(id);
};

export default isValidObjectId;
