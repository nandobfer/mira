import express, { Express, Request, Response } from 'express'
import login from './src/login'
import signup from "./src/signup"
import products from "./src/products"

export const router = express.Router()

router.use("/login", login)
router.use("/signup", signup)
router.use("/products", products)