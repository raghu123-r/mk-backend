import ContactInfo from "../models/ContactInfo.model.js";


// GET contact info
export const getContactInfo = async (req, res) => {
  try {
    const info = await ContactInfo.findOne();
    res.status(200).json(info || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE or UPDATE contact info
export const updateContactInfo = async (req, res) => {
  try {
    const { phone, email, address } = req.body;

    let info = await ContactInfo.findOne();

    if (!info) {
      info = new ContactInfo({ phone, email, address });
    } else {
      info.phone = phone;
      info.email = email;
      info.address = address;
    }

    await info.save();

    res.status(200).json({
      success: true,
      message: "Contact info updated successfully",
      data: info,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
