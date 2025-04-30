export const validate = (schema:any,source:'body'|'query'|'params'="body")=>{
    console.log("validation func");
    
    return (req:any,res:any,next:any)=>{
        const {error} = schema.validate(req[source],{ abortEarly: false });

        if(error){
            const formattedErrors = error.details.map((err:any)=>{
                return {
                    field:err.path[0],
                    message:err.message
                }
            })
            return res.status(400).json({
                success:false,
                message:"Validation failed",
                errors:formattedErrors[0]
            })
        }
        next()
    }
}