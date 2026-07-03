import { createServer } from 'http'
import { Server } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// In-memory realtime state
const drivers = new Map() // socketId -> { id, name, lat, lng, online }
const rooms = new Set(['customer', 'driver', 'restaurant', 'admin'])

function log(...a) {
  console.log(`[realtime ${new Date().toISOString().slice(11, 19)}]`, ...a)
}

io.on('connection', (socket) => {
  log('connect', socket.id)

  socket.on('identify', (data: { role: string; id?: string; name?: string }) => {
    socket.data.role = data.role
    socket.data.id = data.id
    socket.data.name = data.name
    socket.join(data.role)
    if (data.role === 'driver') {
      drivers.set(socket.id, { id: data.id, name: data.name, lat: 4.6521, lng: -74.0635, online: true })
      socket.to('customer').emit('driver-online', { id: data.id, name: data.name })
    }
    log('identified', data.role, data.id)
  })

  // ---- Order lifecycle ----
  // Customer places order -> notify restaurant + admin
  socket.on('order:created', (order) => {
    log('order:created', order.code)
    socket.to('restaurant').emit('order:new', order)
    socket.to('admin').emit('order:new', order)
    io.to('customer').emit('order:update', order)
  })

  // Status changes (from restaurant/driver/admin)
  socket.on('order:status', (payload: { orderId: string; code: string; status: string; label?: string; restaurantId?: string; driverId?: string; etaMin?: number }) => {
    log('order:status', payload.code, '->', payload.status)
    io.to('customer').emit('order:update', { ...payload, type: 'status' })
    io.to('restaurant').emit('order:update', { ...payload, type: 'status' })
    io.to('driver').emit('order:update', { ...payload, type: 'status' })
    io.to('admin').emit('order:update', { ...payload, type: 'status' })
  })

  // ---- Driver location ----
  socket.on('driver:location', (payload: { orderId: string; lat: number; lng: number; driverId: string }) => {
    const d = drivers.get(socket.id)
    if (d) { d.lat = payload.lat; d.lng = payload.lng }
    io.to('customer').emit('driver:location', payload)
    io.to('admin').emit('driver:location', payload)
  })

  // Driver assignment
  socket.on('driver:assigned', (payload: { orderId: string; driverId: string; driverName: string; driverColor: string }) => {
    log('driver:assigned', payload.orderId, '->', payload.driverName)
    io.to('customer').emit('order:update', { ...payload, type: 'driver' })
    io.to('restaurant').emit('order:update', { ...payload, type: 'driver' })
    io.to('admin').emit('order:update', { ...payload, type: 'driver' })
  })

  // ---- Chat ----
  socket.on('chat:message', (msg: { orderId: string; sender: string; text: string; at: string }) => {
    log('chat', msg.orderId, '<-', msg.sender)
    io.to('customer').emit('chat:message', msg)
    io.to('driver').emit('chat:message', msg)
    io.to('restaurant').emit('chat:message', msg)
  })

  // ---- Typing indicator ----
  socket.on('chat:typing', (payload: { orderId: string; who: string }) => {
    socket.broadcast.emit('chat:typing', payload)
  })

  // ---- Admin broadcast (promotions) ----
  socket.on('admin:broadcast', (payload) => {
    io.to('customer').emit('admin:broadcast', payload)
  })

  // ---- Restaurant toggles menu item availability ----
  socket.on('menu:updated', (payload: { restaurantId: string }) => {
    io.to('customer').emit('menu:updated', payload)
    io.to('admin').emit('menu:updated', payload)
  })

  socket.on('disconnect', () => {
    const d = drivers.get(socket.id)
    if (d) {
      drivers.delete(socket.id)
      socket.to('customer').emit('driver-offline', { id: d.id })
    }
    log('disconnect', socket.id)
  })

  socket.on('error', (err) => console.error('socket error', err))
})

const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`Antojo realtime service running on port ${PORT}`)
})

process.on('SIGTERM', () => httpServer.close(() => process.exit(0)))
process.on('SIGINT', () => httpServer.close(() => process.exit(0)))
