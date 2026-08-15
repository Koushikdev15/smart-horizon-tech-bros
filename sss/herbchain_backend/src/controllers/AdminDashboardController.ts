import { Request, Response, NextFunction } from 'express';
import { AdminDashboardService } from '../services/AdminDashboardService';
import { sendResponse } from '../utils/response';

export class AdminDashboardController {
  private dashboardService = new AdminDashboardService();

  getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.dashboardService.getStats();
      return sendResponse(res, 200, true, 'Dashboard stats fetched', result);
    } catch (err) {
      next(err);
    }
  };
}
