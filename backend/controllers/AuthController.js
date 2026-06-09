const { Customer } = require('../models');
const jwt = require('jsonwebtoken');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Super Admin
    if (username.toLowerCase() === ADMIN_USERNAME.toLowerCase() && password === ADMIN_PASSWORD) {
      const token = jwt.sign({ name: 'Haris Azam', role: 'Super Admin' }, JWT_SECRET, { expiresIn: '1d' });
      return res.json({ name: 'Haris Azam', role: 'Super Admin', token });
    }

    // Client
    const customer = await Customer.findOne({ where: { email: username } });
    if (customer && (password === customer.password || password === customer.whatsAppNumber)) {
      const token = jwt.sign({ 
        name: customer.name, 
        role: 'Client', 
        customerId: customer.whatsAppNumber 
      }, JWT_SECRET, { expiresIn: '1d' });
      
      return res.json({ 
        name: customer.name, 
        role: 'Client', 
        customerId: customer.whatsAppNumber,
        token 
      });
    }

    // Team Member
    const { TeamMember } = require('../models');
    const teamMember = await TeamMember.findOne({ where: { username, isActive: true } });
    if (teamMember && password === teamMember.password) {
      const token = jwt.sign({
        name: teamMember.fullName,
        role: 'TeamMember',
        customerId: teamMember.customerId,
        username: teamMember.username
      }, JWT_SECRET, { expiresIn: '1d' });

      return res.json({
        name: teamMember.fullName,
        role: 'TeamMember',
        customerId: teamMember.customerId,
        token
      });
    }

    res.status(401).json({ message: 'Invalid Username or Password' });
  } catch (error) {
    console.error('LOGIN ERROR:', error);
    res.status(500).json({ message: error.message || 'Login error' });
  }
};

exports.getCurrentUser = async (req, res) => {
  if (req.user.role === 'Client') {
    const customer = await Customer.findByPk(req.user.customerId);
    if (customer) {
      const daysLeft = customer.subscriptionExpiry ? Math.max(0, Math.ceil((new Date(customer.subscriptionExpiry) - new Date()) / (1000 * 60 * 60 * 24))) : 0;
      return res.json({
        ...req.user,
        name: customer.name,
        email: customer.email,
        profileImage: customer.profileImage,
        subscriptionStatus: customer.subscriptionStatus,
        moduleComplains: customer.moduleComplains,
        moduleInstruction: customer.moduleInstruction,
        moduleComplainsFields: customer.moduleComplainsFields,
        moduleInstructionFields: customer.moduleInstructionFields,
        daysLeft
      });
    }
  } else if (req.user.role === 'Super Admin') {
    return res.json({
      ...req.user,
      name: process.env.ADMIN_NAME || 'Haris Azam',
      email: process.env.ADMIN_USERNAME,
      profileImage: process.env.ADMIN_PROFILE_IMAGE
    });
  } else if (req.user.role === 'TeamMember') {
    const { TeamMember } = require('../models');
    const member = await TeamMember.findOne({ where: { username: req.user.username } });
    if (member) {
      const customer = await Customer.findByPk(member.customerId);
      return res.json({
        ...req.user,
        name: member.fullName,
        email: member.username,
        role: 'TeamMember',
        monthlyGoal: member.monthlyGoal,
        moduleComplains: customer ? customer.moduleComplains : false,
        moduleInstruction: customer ? customer.moduleInstruction : false,
        moduleComplainsFields: customer ? customer.moduleComplainsFields : [],
        moduleInstructionFields: customer ? customer.moduleInstructionFields : []
      });
    }
  }
  res.json(req.user);
};

exports.logout = async (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

const { updateEnv } = require('../utils/envUpdater');

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (req.user.role === 'Super Admin') {
      const updates = {};
      if (email) updates.ADMIN_USERNAME = email; // Using email as username for admin
      if (password) updates.ADMIN_PASSWORD = password;
      if (name) updates.ADMIN_NAME = name;
      
      updateEnv(updates);
      return res.json({ message: 'Admin profile updated successfully', name: name || process.env.ADMIN_NAME || 'Haris Azam' });
    } else {
      const customer = await Customer.findByPk(req.user.customerId);
      if (!customer) return res.status(404).json({ message: 'Customer not found' });
      
      if (name) customer.name = name;
      if (email) customer.email = email;
      if (password) customer.password = password;
      
      await customer.save();
      return res.json({ message: 'Profile updated successfully', name: customer.name });
    }
  } catch (error) {
    console.error('PROFILE UPDATE ERROR:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
    if (req.user.role === 'Super Admin') {
      updateEnv({ ADMIN_PROFILE_IMAGE: imageUrl });
      return res.json({ message: 'Image uploaded successfully', imageUrl });
    } else {
      const customer = await Customer.findByPk(req.user.customerId);
      if (!customer) return res.status(404).json({ message: 'Customer not found' });
      
      customer.profileImage = imageUrl;
      await customer.save();
      return res.json({ message: 'Image uploaded successfully', imageUrl });
    }
  } catch (error) {
    console.error('IMAGE UPLOAD ERROR:', error);
    res.status(500).json({ message: 'Error uploading image' });
  }
};
