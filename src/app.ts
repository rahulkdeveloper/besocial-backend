import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
import morgan from "morgan";
import { Request, Response } from 'express'
import dbConnection from './db/connection';
// import cors from "cors";

dbConnection();


// app.use(cors())

app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }))


app.get("/",async (req:any,res:any)=>{
    return res.send("server is running")
})


export default app;