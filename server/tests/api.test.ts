import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Bizpoa POS Server API Tests', () => {
  const app = createApp();

  test('GET /api/health returns healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  test('GET /api/products returns product inventory', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('POST /api/sales creates a sale and reduces stock', async () => {
    const productsRes = await request(app).get('/api/products');
    const firstProduct = productsRes.body.data[0];
    const initialQty = firstProduct.qty;

    const salePayload = {
      lines: [{ name: firstProduct.name, qty: 1, price: firstProduct.price }],
      total: firstProduct.price,
      method: 'cash',
      tendered: firstProduct.price + 50,
      change: 50,
      phone: '+254712345678',
      sendReceiptSMS: false
    };

    const saleRes = await request(app).post('/api/sales').send(salePayload);
    expect(saleRes.status).toBe(201);
    expect(saleRes.body.success).toBe(true);
    expect(saleRes.body.data.total).toBe(firstProduct.price);

    // Verify stock reduced
    const updatedProductsRes = await request(app).get('/api/products');
    const updatedProduct = updatedProductsRes.body.data.find((p: any) => p.id === firstProduct.id);
    expect(updatedProduct.qty).toBe(initialQty - 1);
  });

  test('POST /api/ussd handles Africa\'s Talking USSD protocol', async () => {
    // 1. Initial dial
    const initRes = await request(app)
      .post('/api/ussd')
      .send({ sessionId: 'sess_1', serviceCode: '*384*5012#', phoneNumber: '+254712345678', text: '' });
    expect(initRes.status).toBe(200);
    expect(initRes.text.startsWith('CON')).toBe(true);
    expect(initRes.text).toContain('1. Today\'s Sales Summary');

    // 2. Select option 1 (Today's sales)
    const option1Res = await request(app)
      .post('/api/ussd')
      .send({ sessionId: 'sess_1', serviceCode: '*384*5012#', phoneNumber: '+254712345678', text: '1' });
    expect(option1Res.status).toBe(200);
    expect(option1Res.text.startsWith('CON')).toBe(true);
    expect(option1Res.text).toContain('Income: KES');
  });
});
