#!/usr/bin/env python
# encoding: utf-8

# Install Dependencies:
# pip install flask
# pip install pyodbc

import json
import pyodbc
from datetime import datetime, timedelta
from flask import request
from flask import Flask
import flask
import socket

app = Flask(__name__)

# get current pc (local) IP address
hostname = socket.gethostname()
IPAddr = socket.gethostbyname(hostname)

isLocal = False

allMyIps = [i[4][0] for i in socket.getaddrinfo(socket.gethostname(), None)]

# if allMyIps contains '192.168.88.10' the it is local

if '192.168.88.16' in allMyIps:
  isLocal = True
  print("Running on local network")

server = "ADM1-PC\\PROFIT"

if isLocal:
  server = "localhost\\SQLEXPRESS"

def connect(corporation):
  cnxn_str = ''
  
  if corporation == 'RELEVECA':
    cnxn_str = ("Driver={SQL Server};"
              f"Server={server};"
              "Database=RVCA_A;"
              "Trusted_Connection=yes;")
  elif corporation == 'LYC':
    cnxn_str = ("Driver={SQL Server};"
              f"Server={server};"
              "Database=LYC_A;"
              "Trusted_Connection=yes;")

  return pyodbc.connect(cnxn_str)

def SQLGet(query, corporation):
  conn = connect(corporation)
  cursor = conn.cursor()
  cursor.execute(query)
     
  columns = [column[0] for column in cursor.description]
  data = [dict(zip(columns, row)) for row in cursor.fetchall()]
  json_data = json.dumps(data, indent=4, sort_keys=True, default=str)

  response = flask.jsonify(json_data)
  response.headers.add('Access-Control-Allow-Origin', '*')

  return response

@app.route('/', methods=['GET'])
def index():
    tomorrow = datetime.now()  + timedelta(days=1)

    corporation = request.args.get('corporation', default = '', type = str)
    if corporation == '':
      return 'ERROR: No corporation provided'

    from_date = request.args.get('from', default = '1999-01-01 00:00:00', type = str)
    to_date = request.args.get('to', default = tomorrow, type = str)

    from_date = str(from_date).replace('-', '').split('.')[0]
    to_date = str(to_date).replace('-', '').split('.')[0]

    query = f"""
      WITH ordenes_recientes AS (
          SELECT 
              ro.co_art, 
              ro.total_art,
              o.fec_emis as fecha
          FROM 
              reng_ord ro
          INNER JOIN 
              ordenes o ON ro.fact_num = o.fact_num
          WHERE 
              o.fec_emis IN (
                  SELECT 
                      MAX(o.fec_emis)
                  FROM 
                      ordenes o
                  WHERE 
                      o.fact_num = ro.fact_num
              )
      ),
      notas_recientes AS (
          SELECT 
              rn.co_art, 
              rn.total_art,
              nr.fec_emis as fecha
          FROM 
              reng_ndr rn
          INNER JOIN 
              not_rec nr ON rn.fact_num = nr.fact_num
          WHERE 
              nr.fec_emis IN (
                  SELECT 
                      MAX(nr.fec_emis)
                  FROM 
                      not_rec nr
                  WHERE 
                      nr.fact_num = rn.fact_num
              )
      ),


          uniones AS (
            SELECT *
            FROM ordenes_recientes
            WHERE fecha = (
              SELECT MAX(fecha)
              FROM ordenes_recientes
              WHERE co_art = ordenes_recientes.co_art
            )
            UNION ALL
            SELECT *
            FROM notas_recientes
            WHERE fecha = (
              SELECT MAX(fecha)
              FROM notas_recientes
              WHERE co_art = notas_recientes.co_art
            )
          ),

      todos AS (
          SELECT * FROM ordenes_recientes
          UNION ALL
          SELECT * FROM notas_recientes
      )
          
            select
              filtered.*,
              art.art_des as description,
              art.stock_act as stock,
              art.stock_com as stock_comprometido,
              art.stock_lle as stock_esperando,
              prov.prov_des as provider_description,
              art.ult_cos_om as last_cost,
              art.fec_ult_om as last_cost_date,
              sub_lin.subl_des as sub_line,
              art.modelo as ref,
          last_purchase.total_art as last_purchase,
          last_purchase.fecha as last_purchase_date
            from (
            select count(*) as count, sum(num) as total, co_art as item from (
              select co_art, total_art AS num, fec_emis from dbo.reng_fac
              left join dbo.factura on dbo.factura.fact_num = dbo.reng_fac.fact_num
              union all
              select co_art, total_art, fec_emis from dbo.reng_nde
              left join dbo.not_ent on dbo.not_ent.fact_num = dbo.reng_nde.fact_num
            ) as all_items
            where fec_emis between CONVERT(smalldatetime, '{from_date}') and CONVERT(smalldatetime, '{to_date}')
            group by co_art
            ) as filtered
            left join art on filtered.item = art.[co_art]
            left join prov on art.co_prov = prov.co_prov
            left join sub_lin on sub_lin.co_subl = art.co_subl
          
        left join (
        SELECT 
            x.co_art, 
            todos.total_art,
            x.fecha
        FROM 
        (
            SELECT 
                co_art,
                max(fecha) as fecha
            FROM 
            todos
			group by co_art
        ) as x
        left join todos on todos.co_art = x.co_art and todos.fecha = x.fecha
        ) as last_purchase on filtered.item = last_purchase.co_art
    """
    return SQLGet(query, corporation)

@app.route('/no-sales-items', methods=['GET'])
def noSalesItems():
    tomorrow = datetime.now()  + timedelta(days=1)

    corporation = request.args.get('corporation', default = '', type = str)

    if corporation == '':
      return 'ERROR: No corporation provided'

    from_date = request.args.get('from', default = '1999-01-01 00:00:00', type = str)
    to_date = request.args.get('to', default = tomorrow, type = str)

    from_date = str(from_date).replace('-', '').split('.')[0]
    to_date = str(to_date).replace('-', '').split('.')[0]

    query = f"""
      select
        0 as count,
        0 as total,
        co_art as item,
        art_des as description,
        stock_act as stock, 
        stock_com as stock_comprometido,
        stock_lle as stock_esperando,
        prov.prov_des as provider_description,
        art.ult_cos_om as last_cost,
        art.fec_ult_om as last_cost_date,
        sub_lin.subl_des as sub_line,
        art.modelo as ref
      from art 
      left join prov on art.co_prov = prov.co_prov
      left join sub_lin on sub_lin.co_subl = art.co_subl
      where co_art not in (
        select co_art from (
          select co_art, fec_emis from dbo.reng_fac
          left join dbo.factura on dbo.factura.fact_num = dbo.reng_fac.fact_num
          union all
          select co_art, fec_emis from dbo.reng_nde
          left join dbo.not_ent on dbo.not_ent.fact_num = dbo.reng_nde.fact_num
          where fec_emis between CONVERT(smalldatetime, '{from_date}') and CONVERT(smalldatetime, '{to_date}')
        ) as filtered
      )
    """
    return SQLGet(query, corporation)

@app.route('/all-items', methods=['GET'])
def allItems():
    tomorrow = datetime.now()  + timedelta(days=1)

    corporation = request.args.get('corporation', default = '', type = str)

    if corporation == '':
      return 'ERROR: No corporation provided'

    from_date = request.args.get('from', default = '1999-01-01 00:00:00', type = str)
    to_date = request.args.get('to', default = tomorrow, type = str)

    from_date = str(from_date).replace('-', '').split('.')[0]
    to_date = str(to_date).replace('-', '').split('.')[0]

    query = f"""
      select
        0 as count,
        0 as total,
        co_art as item,
        art_des as description,
        stock_act as stock, 
        stock_com as stock_comprometido,
        stock_lle as stock_esperando,
        prov.prov_des as provider_description,
        art.ult_cos_om as last_cost,
        art.fec_ult_om as last_cost_date,
        sub_lin.subl_des as sub_line,
        art.modelo as ref
      from art 
      left join prov on art.co_prov = prov.co_prov
      left join sub_lin on sub_lin.co_subl = art.co_subl
    """
    return SQLGet(query, corporation)

@app.route('/per-id-range', methods=['GET'])
def perIdRange():
    corporation = request.args.get('corporation', default = '', type = str)
    from_id = request.args.get('from', default = '0', type = str)
    to_id = request.args.get('to', default = '0', type = str)

    if corporation == '':
      return 'ERROR: No corporation provided'
    
    if from_id == '0' or to_id == '0':
      return 'ERROR: No id range provided'
    
    if int(from_id) > int(to_id):
      return 'ERROR: From id is greater than to id'

    query = f"""
      select
          items.item,
          items.total,
          dbo.art.art_des as description,
          sub_lin.subl_des as sub_line,
          art.modelo as ref,
          sub_alma.des_sub as store
        from(
          select
            co_art as item,
            co_alma as store_id,
            sum(total_art) as total
          from dbo.reng_nde
          where reng_nde.fact_num between {from_id} and {to_id}
          group by co_art, co_alma
        ) as items
      left join dbo.art on dbo.art.co_art = items.item
      left join sub_lin on sub_lin.co_subl = art.co_subl
      left join sub_alma on sub_alma.co_sub = items.store_id
    """
    return SQLGet(query, corporation)

if isLocal:
  app.run(debug=True, port=8081)
else:
  app.run(host='0.0.0.0', port=8080)
