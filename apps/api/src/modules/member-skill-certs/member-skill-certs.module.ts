import { Module } from '@nestjs/common';
import { MemberSkillCertsController } from './member-skill-certs.controller';
import { MemberSkillCertsService } from './member-skill-certs.service';

@Module({
  controllers: [MemberSkillCertsController],
  providers: [MemberSkillCertsService],
  exports: [MemberSkillCertsService],
})
export class MemberSkillCertsModule {}
