// new promise((resolve)) == Promise.resolve()

const asyncHandler = (func) => {
  return (req,res,next) => {
    Promise.resolve(func(req,res,next)).catch((error)=>{next(error)});
  };
};

export default asyncHandler ;

// # normally
// const asyncHandler = (func) => {
//   return async (req, res, next) => {
//     try {
//       await func(req, res, next);
//     } catch (error) {
//       next(error);
//     }
//   };
// };

