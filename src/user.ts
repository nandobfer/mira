import express, { Express, Request, Response } from "express"
import { PrismaClient } from "@prisma/client"
import { clients } from "./websocket/socket"
import { sendMail } from "./scripts/mail"
import { decrypt, encrypt } from "./scripts/hash"
import { passwordTemplate } from "./templates/mail/password"

const router = express.Router()
const prisma = new PrismaClient()

router.post("/", async (request: Request, response: Response) => {
    const data = request.body
    console.log({ change_password: data.change_password })

    if (data.change_password) {
        const user = await prisma.users.update({
            where: { id: data.id },
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                password: data.new_password,
            },
            include: { addresses: true, cards: true, orders: true },
        })
        response.json(user)
    } else {
        const user = await prisma.users.update({
            where: { id: data.id },
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
            },
            include: { addresses: true, cards: true, orders: true },
        })
        response.json(user)
    }
})

router.post("/address", async (request: Request, response: Response) => {
    const data = request.body
    console.log(data)

    if (data.new_address) {
        const address = await prisma.addresses.create({
            data: {
                receiver: data.receiver,
                phone: data.phone,
                cep: data.cep,
                address: data.address,
                number: Number(data.number.toString().replace(/D/, "")),
                complement: data.complement,
                district: data.district,
                city: data.city,
                uf: data.uf,
                user: data.user_id,
            },
        })

        response.json(address)
    } else {
        const address = await prisma.addresses.update({
            data: {
                receiver: data.receiver,
                phone: data.phone,
                cep: data.cep,
                address: data.address,
                number: Number(data.number.toString().replace(/D/, "")),
                complement: data.complement,
                district: data.district,
                city: data.city,
                uf: data.uf,
            },

            where: { id: data.id },
        })

        response.json(address)
    }
})

router.post("/card", async (request: Request, response: Response) => {
    const data = request.body
    console.log(data)

    if (data.new_card) {
        const card = await prisma.cards.create({
            data: {
                name: data.name,
                number: data.number,
                cvv: data.cvv,
                expiration_month: data.expiration_month,
                expiration_year: data.expiration_year,
                type: data.type,
                user: data.user_id,
            },
        })

        response.json(card)
    } else {
        const card = await prisma.cards.update({
            data: {
                name: data.name,
                number: data.number,
                cvv: data.cvv,
                expiration_month: data.expiration_month,
                expiration_year: data.expiration_year,
                type: data.type,
                user: data.id,
            },

            where: { id: data.id },
        })

        response.json(card)
    }
})

router.get("/ws", async (request: Request, response: Response) => {
    response.json(clients)
})

router.post("/recover", async (request: Request, response: Response) => {
    const data = request.body.user

    const user = await prisma.users.findFirst({ where: { OR: [{ email: data }, { cpf: data }, { username: data }], AND: { deleted: false } } })
    if (user) {
        const hash = encrypt(user.id)
        console.log(hash)
        sendMail(user.email, "Recuperação de senha", "recuperar senha", passwordTemplate(user, hash))
    }

    response.json(user)
})

router.post("/password", async (request: Request, response: Response) => {
    const data = request.body

    const user = await prisma.users.update({
        where: { id: data.id },
        data: { password: data.password },
    })

    response.json(user)
})

router.post("/hash", async (request: Request, response: Response) => {
    const data = request.body.hash

    const id = decrypt(data)
    console.log(id)
    const user = await prisma.users.findUnique({ where: { id } })

    response.json(user)
})

router.post("/delete", async (request: Request, response: Response) => {
    const data = request.body

    const user = await prisma.users.update({ where: { id: data.id }, data: { deleted: true } })
    response.json(user)
})

export default router
