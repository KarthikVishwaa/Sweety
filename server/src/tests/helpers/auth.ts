import request from 'supertest';
import { app } from '../../app.js';

export function createAuthenticatedAgent(email = 'asha@example.com') {
  const agent = request.agent(app);
  return agent
    .post('/api/auth/register')
    .send({ name: 'Test User', email, password: 'sweet1234', dateOfBirth: '1990-05-15' })
    .then(() => agent);
}
