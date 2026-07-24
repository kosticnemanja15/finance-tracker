import { ApiError } from "../errors/ApiError.js";


export function errorHandler(err, req, res, next){
 
    if(err instanceof ApiError) {
        const body = { error: err.message, code: err.code};
        if (err.details) body.details = err.details;
        return res.status(err.status).json(body);
    }

    if(err.type === 'entity.parse.failed'){
        return res.status(400).json({error: 'Invalid JSON',code: 'INVALID_JSON'});
    }

    if (err.type === 'entity.too.large') {
        return res.status(413).json({ error: 'Payload too large', code: 'PAYLOAD_TOO_LARGE' });
    }

    console.log('Unexpected error:', err);

    const body = { error: 'Internal Server Error', code: 'INTERNAL' };

      // Stack trace SAMO van produkcije
    if (config.env !== 'production') {
        body.debug = { message: err.message, stack: err.stack };
    }

    res.status(500).json(body);
}