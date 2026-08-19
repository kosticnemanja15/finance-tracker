import dotenv from "dotenv";

dotenv.config({quiet:true});

const required = ['JWT_SECRET','JWT_EXPIRES_IN','BCRYPT_COST'];


for(const key of required){
    if(!process.env[key]){
        console.error(`❌ Missing required env var: ${key}`);
        process.exit(1);
    }
}

export const config = {
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
  bcrypt: {
    cost: parseInt(process.env.BCRYPT_COST, 10),
  },
  port: parseInt(process.env.PORT || '3000', 10),
  env: process.env.NODE_ENV || 'development',    
  frontendUrl: process.env.FRONTEND_URL,
};

