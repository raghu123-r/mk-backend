import ContactInfo from "../models/ContactInfo.model.js";


// GET contact info
export const getContactInfo = async (req, res) => {
  try {
    const info = await ContactInfo.findOne();
    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: info || {}
    });
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: error.message },
      data: null
    });
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

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: info
    });
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: error.message },
      data: null
    });
  }
};
