import { WebSocketServer, WebSocket } from "ws"
import { orders, users } from "@prisma/client"

interface Client {
    order: orders
    connection: WebSocket
}

interface adm extends users {
    connection: WebSocket
}

export let clients: Client[] = []
export let adms: adm[] = []

export const wsServer = new WebSocketServer({ noServer: true })

export const sendRefresh = (object: "orders" | "products" | "suppliers" | "categories" | "app") => {
    adms.map((adm) => adm.connection.send(JSON.stringify({ refresh: object })))
}

wsServer.on("connection", (connection) => {
    connection.on("message", (message) => {
        const data = JSON.parse(message.toString())
        console.log({ websocket: data })

        if (data.order?.id) {
            const filtered_clients = clients.filter((client) => client.order.id == data.id)

            if (filtered_clients.length > 0) {
                clients = clients.filter((client) => client.order.id != data.order.id)
            }

            clients.push({ order: data.order, connection })
        }

        if (data.adm?.id) {
            console.log("new adm")
            const filtered_adms = adms.filter((adm) => adm.id == data.adm.id)

            if (filtered_adms.length > 0) {
                adms = adms.filter((adm) => adm.id != data.adm.id)
            }

            adms.push({ ...data.adm, connection })
        }
    })
})
