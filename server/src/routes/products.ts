import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { category, search } = req.query;
  let products = db.getProducts();

  if (category && category !== 'All') {
    products = products.filter(p => p.category.toLowerCase() === String(category).toLowerCase());
  }

  if (search) {
    const q = String(search).toLowerCase();
    products = products.filter(p => p.name.toLowerCase().includes(q) || p.barcode.includes(q));
  }

  res.json({ success: true, count: products.length, data: products });
});

router.get('/archived', (req: Request, res: Response) => {
  const archived = db.getArchivedProducts();
  res.json({ success: true, count: archived.length, data: archived });
});

router.get('/barcode/:barcode', (req: Request, res: Response) => {
  const { barcode } = req.params;
  const product = db.getProductByBarcode(barcode);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Barcode not found' });
  }
  res.json({ success: true, data: product });
});

router.post('/', (req: Request, res: Response) => {
  const { name, category, price, qty, barcode, minStockAlert, id } = req.body;
  if (!name || typeof price !== 'number' || typeof qty !== 'number') {
    return res.status(400).json({ success: false, message: 'Name, numeric price and qty are required' });
  }

  const saved = db.saveProduct({ id, name, category, price, qty, barcode, minStockAlert });
  res.status(201).json({ success: true, data: saved });
});

router.post('/:id/adjust', (req: Request, res: Response) => {
  const { id } = req.params;
  const { delta } = req.body;
  if (typeof delta !== 'number') {
    return res.status(400).json({ success: false, message: 'Numeric delta required' });
  }

  const updated = db.adjustStock(id, delta);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  res.json({ success: true, data: updated });
});

router.post('/:id/restore', (req: Request, res: Response) => {
  const { id } = req.params;
  const { qty = 10 } = req.body;
  const restored = db.restoreProduct(id, Number(qty));
  if (!restored) {
    return res.status(404).json({ success: false, message: 'Archived product not found' });
  }
  res.json({ success: true, data: restored });
});

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = db.deleteProduct(id);
  res.json({ success: deleted });
});

export default router;
