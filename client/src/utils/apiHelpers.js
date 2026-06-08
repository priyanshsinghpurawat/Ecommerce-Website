/** Pull { user, token } (or any payload) out of our standard API envelope. */
export function unwrapData(body) {
  if (body == null) return null;
  if (typeof body === 'object' && 'data' in body && body.data !== undefined) {
    return body.data;
  }
  return body;
}

export function getErrorMessage(error, fallback = 'Something went wrong. Try again.') {
  if (!error?.response) {
    if (error?.code === 'ERR_NETWORK') {
      return "Can't reach the shop API. Start the server with `npm run dev` in the /server folder.";
    }
    return error?.message || fallback;
  }
  const msg = error.response.data?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  return msg || fallback;
}
