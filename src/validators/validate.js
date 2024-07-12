import { validationResult } from "express-validator";


/**
 * 
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 * @param {import("express").NextFunction} next 
 * @returns 
 */


export  const validate = (req, res, next)=>{
    const error = validationResult( req );
    if(error.isEmpty()){
        return next();
    }

    let extractedErrors = [];
    error.array().map((err) => extractedErrors.push({ [err.path]: err.msg }));


    res.status(422).json({"Recieved data is not valid": extractedErrors}); 
}