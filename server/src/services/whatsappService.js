async function sendWhatsAppMessage(to, messageText) {
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneId || !accessToken) {
        console.warn("WhatsApp credentials missing in .env. Skipping API call.");
        return { success: false, error: "Missing WhatsApp credentials" };
    }

    const cleanTo = to.replace(/\D/g, "");
    const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;

    const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanTo,
        type: "text",
        text: { body: messageText },
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(payload),
        });
        const data = await response.json();
        return response.ok ? { success: true, data } : { success: false, error: data.error };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Sends media (image, document, video) to WhatsApp using a public URL.
 */
async function sendWhatsAppMedia(to, mediaType, mediaUrl, caption = "") {
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneId || !accessToken) return { success: false, error: "Missing WhatsApp credentials" };

    const cleanTo = to.replace(/\D/g, "");
    const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;

    // Map internal types to WA types
    const waType = mediaType === 'video' ? 'video' : mediaType === 'image' ? 'image' : 'document';
    
    const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanTo,
        type: waType,
        [waType]: {
            link: mediaUrl,
            ...(waType !== 'document' && caption ? { caption } : {}),
            ...(waType === 'document' ? { filename: "document_" + Date.now() } : {})
        }
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(payload),
        });
        const data = await response.json();
        return response.ok ? { success: true, data } : { success: false, error: data.error };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendWhatsAppMessage,
    sendWhatsAppMedia
};
