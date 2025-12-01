import { axiosInstance } from '../utils/config';

export const checkSurveyExists = () => {
  return axiosInstance.get('surveys/exists');
};

export const getAllSurvey = () => {
  return axiosInstance.get('surveys');
};

export const createSurvey = (formData) => {
  return axiosInstance.post('surveys', formData);
};

export const getSurvey = (id) => {
  return axiosInstance.get(`surveys/${id}`);
};

export const updateSurvey = (id) => {
  return axiosInstance.patch(`surveys/${id}`);
};

export const deleteSurvey = (id) => {
  return axiosInstance.delete(`surveys/${id}`);
};

export const createSurveyRow = (id, formData) => {
  return axiosInstance.post(`surveys/${id}/rows`, formData);
};

export const endSurvey = (id) => {
  return axiosInstance.patch(`surveys/${id}/end`);
};

export const updateSurveyRow = (id, rowId) => {
  return axiosInstance.patch(`surveys/${id}/rows/${rowId}`);
};

export const deleteSurveyRow = (id) => {
  return axiosInstance.delete(`surveys/${id}/rows/${rowId}`);
};

export const getAllSurveyPurpose = () => {
  return axiosInstance.get('surveys/purposes');
};

export const createSurveyPurpose = (id, formData) => {
  return axiosInstance.post(`surveys/${id}/purposes`, formData);
};

export const generateSurveyPurpose = (id, formData) => {
  return axiosInstance.post(`surveys/${id}/purposes/generate`, formData);
};

export const getSurveyPurpose = (id) => {
  return axiosInstance.get(`surveys/${id}/purposes`);
};

export const endSurveyPurpose = (id, finalForesight) => {
  return axiosInstance.patch(
    `surveys/${id}/purposes/end?finalForesight=${finalForesight}`
  );
};

export const pauseSurveyPurpose = (id, foreSight, remark) => {
  return axiosInstance.patch(
    `surveys/${id}/purposes/pause?foreSight=${foreSight}&remark=${remark}`
  );
};
