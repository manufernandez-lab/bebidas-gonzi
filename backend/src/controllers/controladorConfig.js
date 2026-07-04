import { servicioConfig } from '../services/servicioConfig.js';

export const getConfig = async (req, res, next) => {
  try {
    const config = await servicioConfig.getConfig();
    
    res.status(200).json({
      status: 'success',
      data: { config }
    });
  } catch (error) {
    next(error);
  }
};

export const updateConfig = async (req, res, next) => {
  try {
    const updated = await servicioConfig.updateConfig(req.body);
    
    res.status(200).json({
      status: 'success',
      data: { config: updated }
    });
  } catch (error) {
    next(error);
  }
};
