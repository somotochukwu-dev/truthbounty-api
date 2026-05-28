import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvidenceService } from './evidence.service';
import { Evidence } from './entities/evidence.entity';
import { EvidenceVersion } from './entities/evidence-version.entity';
import { AuditTrailService } from '../audit/services/audit-trail.service';

describe('EvidenceService', () => {
  let service: EvidenceService;
  let evidenceRepo: Repository<Evidence>;
  let evidenceVersionRepo: Repository<EvidenceVersion>;
  let auditTrailService: AuditTrailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvidenceService,
        {
          provide: getRepositoryToken(Evidence),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(EvidenceVersion),
          useClass: Repository,
        },
        {
          provide: AuditTrailService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EvidenceService>(EvidenceService);
    evidenceRepo = module.get<Repository<Evidence>>(getRepositoryToken(Evidence));
    evidenceVersionRepo = module.get<Repository<EvidenceVersion>>(getRepositoryToken(EvidenceVersion));
    auditTrailService = module.get<AuditTrailService>(AuditTrailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEvidence', () => {
    it('should return evidence if not hidden', async () => {
      const evidence = { id: 'ev-1', isHidden: false } as Evidence;
      jest.spyOn(evidenceRepo, 'findOne').mockResolvedValue(evidence);

      const result = await service.getEvidence('ev-1');

      expect(result).toEqual(evidence);
      expect(evidenceRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ev-1', isHidden: false },
        }),
      );
    });

    it('should return null if hidden and includeHidden is false', async () => {
      jest.spyOn(evidenceRepo, 'findOne').mockResolvedValue(null);

      const result = await service.getEvidence('ev-1');

      expect(result).toBeNull();
      expect(evidenceRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ev-1', isHidden: false },
        }),
      );
    });

    it('should return evidence if hidden and includeHidden is true', async () => {
      const evidence = { id: 'ev-1', isHidden: true } as Evidence;
      jest.spyOn(evidenceRepo, 'findOne').mockResolvedValue(evidence);

      const result = await service.getEvidence('ev-1', true);

      expect(result).toEqual(evidence);
      expect(evidenceRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ev-1' },
        }),
      );
    });
  });

  describe('getEvidenceForClaim', () => {
    it('should filter out hidden evidence by default', async () => {
      const claimId = 'claim-1';
      const evidences = [{ id: 'ev-1', isHidden: false }] as Evidence[];
      jest.spyOn(evidenceRepo, 'find').mockResolvedValue(evidences);

      const result = await service.getEvidenceForClaim(claimId);

      expect(result).toEqual(evidences);
      expect(evidenceRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { claimId, isHidden: false },
        }),
      );
    });

    it('should include hidden evidence if includeHidden is true', async () => {
      const claimId = 'claim-1';
      const evidences = [
        { id: 'ev-1', isHidden: false },
        { id: 'ev-2', isHidden: true },
      ] as Evidence[];
      jest.spyOn(evidenceRepo, 'find').mockResolvedValue(evidences);

      const result = await service.getEvidenceForClaim(claimId, true);

      expect(result).toEqual(evidences);
      expect(evidenceRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { claimId },
        }),
      );
    });
  });
});
