// For static data
export const getContactInfo = async (req, res) => {
  try {
    const contactInfo = {
      phone: "+91 8989889880",
      email: "saleskitchenkittles@gmail.com",
      address: `Ground floor & First floor, No. 305, Shop No. 9,
Varthur Main Road, Opp. Shani Mahatma Temple,
Gunjur, Bengaluru – 560087`,
    };
    res.status(200).json(contactInfo);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch contact info" });
  }
};

// If you want MongoDB dynamic data instead of static
/*
import Contact from "../models/Contact.js";

export const getContactInfo = async (req, res) => {
  try {
    const contact = await Contact.findOne();
    res.status(200).json(contact);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch contact info" });
  }
};
*/
