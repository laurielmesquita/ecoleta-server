import express from 'express'

const routes = express()

routes.get('/', (request, response) => {
  return response.json({ messege: 'Hello NLW' })
})

export default routes