import { Router, Request, Response } from 'express';
import { handleUSSDRequest } from '../services/ussdEngine.js';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  const { sessionId = '', serviceCode = '*384*5012#', phoneNumber = '', text = '' } = req.body;

  const responseText = handleUSSDRequest({
    sessionId: String(sessionId),
    serviceCode: String(serviceCode),
    phoneNumber: String(phoneNumber),
    text: String(text)
  });

  res.set('Content-Type', 'text/plain');
  res.send(responseText);
});

export default router;
