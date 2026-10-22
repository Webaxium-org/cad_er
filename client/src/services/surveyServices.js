import { axiosInstance } from "../utils/config";

const normalizeRow = (row) => {
  if (!row) return row;
  
  // Normalize remarks for non-chainage rows (backward compatibility)
  const remarks = row.remarks || [];
  if (row.type !== "Chainage") {
    if (row.remark && remarks.length === 0) {
      remarks.push(row.remark);
    }
  }

  // Populate parallel arrays for Chainage rows if intermediateOffsets is present
  if (row.type === "Chainage" && Array.isArray(row.intermediateOffsets)) {
    return {
      ...row,
      offsets: row.intermediateOffsets.map((e) => e.offset),
      reducedLevels: row.reducedLevels || [],
      intermediateSight: row.intermediateOffsets.map((e) => e.is),
      remarks: row.intermediateOffsets.map((e) => e.remark),
    };
  }

  // Backward compatibility for Water Level rows created before it became TBM-like.
  if (
    row.type === "Water Level" &&
    Array.isArray(row.intermediateOffsets) &&
    row.intermediateOffsets.length &&
    !row.intermediateSight?.length
  ) {
    return {
      ...row,
      offsets: row.intermediateOffsets.map((e) => e.offset),
      reducedLevels: row.reducedLevels || [],
      intermediateSight: row.intermediateOffsets.map((e) => e.is),
      remarks: row.intermediateOffsets.map((e) => e.remark),
    };
  }

  return {
    ...row,
    remarks
  };
};

const normalizePurpose = (purpose) => {
  if (!purpose) return purpose;
  if (Array.isArray(purpose.rows)) {
    purpose.rows = purpose.rows.map(normalizeRow);
  }
  return purpose;
};

const normalizeSurvey = (survey) => {
  if (!survey) return survey;
  if (Array.isArray(survey.purposes)) {
    survey.purposes = survey.purposes.map(normalizePurpose);
  }
  if (Array.isArray(survey.branches)) {
    survey.branches = survey.branches.map((b) => {
      if (b.purposes) b.purposes = b.purposes.map(normalizePurpose);
      return b;
    });
  }
  if (survey.branchDetails?.currentBranch) {
    normalizeSurvey(survey.branchDetails.currentBranch);
  }
  return survey;
};

export const checkSurveyExists = () => {
  return axiosInstance.get("surveys/exists");
};

export const getAllSurvey = async (params) => {
  const response = await axiosInstance.get("surveys", { params });
  if (response.data && Array.isArray(response.data.surveys)) {
    response.data.surveys = response.data.surveys.map(normalizeSurvey);
  }
  return response;
};

export const createSurvey = async (formData) => {
  const response = await axiosInstance.post("surveys", formData);
  if (response.data && response.data.survey) {
    response.data.survey = normalizeSurvey(response.data.survey);
  }
  return response;
};

export const queueSurvey = (formData) => {
  return axiosInstance.post("surveys/queue", formData);
};

export const completeSurvey = async (id, formData) => {
  const response = await axiosInstance.patch(`surveys/${id}/complete`, formData);
  if (response.data && response.data.survey) {
    response.data.survey = normalizeSurvey(response.data.survey);
  }
  return response;
};

export const getSurvey = async (id) => {
  const response = await axiosInstance.get(`surveys/${id}`);
  if (response.data && response.data.survey) {
    response.data.survey = normalizeSurvey(response.data.survey);
  }
  return response;
};

export const updateSurvey = (id) => {
  return axiosInstance.patch(`surveys/${id}`);
};

export const deleteSurvey = (id) => {
  return axiosInstance.delete(`surveys/${id}`);
};

export const createSurveyRow = async (id, formData) => {
  const response = await axiosInstance.post(`surveys/${id}/rows`, formData);
  if (response.data) {
    if (response.data.row) response.data.row = normalizeRow(response.data.row);
    if (response.data.purpose) response.data.purpose = normalizePurpose(response.data.purpose);
  }
  return response;
};

export const endSurvey = (id) => {
  return axiosInstance.patch(`surveys/${id}/end`);
};

export const updateSurveyRow = async (id, rowId, formData) => {
  const response = await axiosInstance.patch(`surveys/${id}/rows/${rowId}`, formData);
  if (response.data && response.data.row) {
    response.data.row = normalizeRow(response.data.row);
  }
  return response;
};

export const deleteSurveyRow = (id, rowId) => {
  return axiosInstance.delete(`surveys/${id}/rows/${rowId}`);
};

export const getAllSurveyPurpose = () => {
  return axiosInstance.get("surveys/purposes");
};

export const createSurveyPurpose = (id, formData) => {
  return axiosInstance.post(`surveys/${id}/purposes`, formData);
};

export const deleteSurveyPurpose = (id) => {
  return axiosInstance.delete(`surveys/${id}/purposes`);
};

export const generateSurveyPurpose = async (id, formData) => {
  const response = await axiosInstance.post(`surveys/${id}/purposes/generate`, formData);
  if (response.data && response.data.purpose) {
    response.data.purpose = normalizePurpose(response.data.purpose);
  }
  return response;
};

export const generateWaterWayProposalPurpose = async (id, formData) => {
  const response = await axiosInstance.post(
    `surveys/${id}/purposes/generate-water-way`,
    formData,
  );
  if (response.data && response.data.purpose) {
    response.data.purpose = normalizePurpose(response.data.purpose);
  }
  return response;
};

export const getSurveyPurpose = async (id) => {
  const response = await axiosInstance.get(`surveys/${id}/purposes`);
  if (response.data && response.data.purpose) {
    response.data.purpose = normalizePurpose(response.data.purpose);
  }
  return response;
};

export const getFieldBook = async (id) => {
  const response = await axiosInstance.get(`surveys/${id}/purposes/field-book`);
  if (response.data && response.data.survey) {
    response.data.survey = normalizeSurvey(response.data.survey);
  }
  return response;
};

export const endSurveyPurpose = (id, finalForesight, pls) => {
  return axiosInstance.patch(
    `surveys/${id}/purposes/end?finalForesight=${finalForesight}&pls=${pls}`,
  );
};

export const pauseSurveyPurpose = (id, foreSight, remark) => {
  return axiosInstance.patch(
    `surveys/${id}/purposes/pause?foreSight=${foreSight}&remark=${remark}`,
  );
};

export const editSurveyPurpose = (payload) => {
  return axiosInstance.put(
    `surveys/${payload.surveyId}/purposes/${payload.purposeId}/edit`,
    {
      updatedRows: payload.updatedRows,
    },
  );
};

export const updateReducedLevels = (id, payload) => {
  return axiosInstance.patch(`surveys/${id}/reduced-levels/edit`, {
    payload,
  });
};

export const createBranch = (surveyId, formData) => {
  return axiosInstance.post(`surveys/${surveyId}/branches`, formData);
};

export const enterBranch = (surveyId, formData) => {
  return axiosInstance.post(
    `surveys/${surveyId}/branches/enter-branch`,
    formData,
  );
};

export const createBreak = (id, formData) => {
  return axiosInstance.post(`surveys/${id}/rows/break`, formData);
};

export const getSurveyDeductions = (surveyId) => axiosInstance.get(`surveys/${surveyId}/deductions`);
export const createSurveyDeduction = (surveyId, payload) => axiosInstance.post(`surveys/${surveyId}/deductions`, payload);
export const deleteSurveyDeduction = (surveyId, deductionId) => axiosInstance.delete(`surveys/${surveyId}/deductions/${deductionId}`);
