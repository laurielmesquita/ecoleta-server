import { Request, Response } from 'express'
import knex from '../database/connection'

class PointsController {

  async index (request: Request, response: Response) {
    const { city, uf, items } = request.query

    const parsedItems = String(items)
      .split(',')
      .map(item => Number(item.trim()))

    const points = await knex('points')
      .join('point_items', 'points.id', '=', 'point_items.point_id')
      // BUSCANDO TODOS OS PONTOS QUE TEM AO MENOS UM ITEM QUE ESTA DENTRO
      // DOS PARAMETROS DO FILTRO
      .whereIn('point_items.item_id', parsedItems)
      // DENTRO DAS CIDADES DO FILTRO
      .where('city', String(city))
      // DENTRO DOS UF DO FILTRO
      .where('uf', String(uf))
      // QUER SEJAM DISTINTOS
      .distinct()
      // SELECT PARA BUSCAR TODOS OS DADOS DA TABELA 'POINTS'
      // E NÃO DA TABELA QUE FOI FEITO O 'JOIN'
      .select('points.*')

    const serializedPoints = points.map(point => {
      return {
        ...point,
        image_url: `http://192.168.100.3:3333/uploads/${point.image}`
      }
    })
  
    return response.json(serializedPoints)
  }

  async show (request: Request, response: Response) {
    const { id } = request.params

    const point = await knex('points').where('id', id).first()

    if (!point) {
      return response.status(400).json({ messege: 'Point not found!' })
    }

    const serializedPoint = {
        ...point,
        image_url: `http://192.168.100.3:3333/uploads/${point.image}`
    }

    const items = await knex('items')
      .join('point_items', 'items.id', '=', 'point_items.item_id')
      .where('point_items.point_id', id)
      .select('title')

    return response.json({point: serializedPoint, items})
  }
  
  async create (request: Request, response: Response) {
    const {
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
      items
    } = request.body
  
    const trx = await knex.transaction()

    const point = {
      image: request.file.filename,
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf
    }
  
    const insertedIds = await trx('points').insert(point)
  
    const point_id = insertedIds[0]
  
    const pointItems = items
      .split(',')
      .map((item: string) => Number(item.trim()))
      .map((item_id: number) => {
        return {
          item_id,
          point_id
        }
      })
  
    await trx('point_items').insert(pointItems)

    await trx.commit()
  
    return response.json({ id: point_id, ...point })
  }
}

export default PointsController