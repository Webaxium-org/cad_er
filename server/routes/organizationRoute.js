import { Router } from 'express';
import * as organizationController from '../controllers/organizationController.js';

const router = Router();

// GET all organizations
router.get('/', organizationController.getAllOrganizations);

// GET single organization
router.get('/:id', organizationController.getOrganizationById);

// CREATE organization
router.post('/', organizationController.createOrganization);

// UPDATE organization
router.put('/:id', organizationController.updateOrganization);

// DELETE organization
router.delete('/:id', organizationController.deleteOrganization);

export default router;
