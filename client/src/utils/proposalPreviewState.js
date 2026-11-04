export const initialPreviewState = { context: null, purpose: null, busy: false, error: "", validation: false };

export function proposalPreviewReducer(state, action) {
  if (action.type === "start") {
    return { context: action.context, purpose: state.context === action.context ? state.purpose : null, busy: true, error: "", validation: false };
  }
  if (action.context !== state.context) return state;
  if (action.type === "success") return { ...state, purpose: action.purpose, busy: false, error: "", validation: false };
  if (action.type === "failure") return { ...state, busy: false, error: action.error, validation: Boolean(action.validation) };
  return state;
}
