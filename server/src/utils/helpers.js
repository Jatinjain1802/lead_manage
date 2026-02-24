function normalizePhone(value) {
  if (!value) return null;
  const stringValue = String(value).trim();
  if (!stringValue) return null;
  const normalized = stringValue.startsWith("+")
    ? `+${stringValue.slice(1).replace(/\D/g, "")}`
    : stringValue.replace(/\D/g, "");
  return normalized || null;
}

function getMessageText(message) {
  if (message?.text?.body) return message.text.body;
  if (message?.button?.text) return message.button.text;
  if (message?.interactive?.button_reply?.title) {
    return message.interactive.button_reply.title;
  }
  if (message?.interactive?.list_reply?.title) {
    return message.interactive.list_reply.title;
  }
  return message?.type || "message";
}

module.exports = {
  normalizePhone,
  getMessageText,
};
