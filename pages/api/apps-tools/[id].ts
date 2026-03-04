import type { NextApiRequest, NextApiResponse } from 'next';
import { connectMongo } from '../../../src/lib/mongodb';
import AppTool from '../../../src/lib/models/AppTool';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectMongo();

  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      const { title, imageUrl, description, link, category } = req.body;

      const appTool = await AppTool.findByIdAndUpdate(
        id,
        { title, imageUrl, description, link, category },
        { new: true, runValidators: true }
      );

      if (!appTool) {
        return res.status(404).json({ error: 'App/Tool not found' });
      }

      return res.status(200).json(appTool);
    } catch (error) {
      console.error('Error updating app/tool:', error);
      return res.status(500).json({ error: 'Failed to update app/tool' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const appTool = await AppTool.findByIdAndDelete(id);

      if (!appTool) {
        return res.status(404).json({ error: 'App/Tool not found' });
      }

      return res.status(200).json({ message: 'App/Tool deleted successfully' });
    } catch (error) {
      console.error('Error deleting app/tool:', error);
      return res.status(500).json({ error: 'Failed to delete app/tool' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
