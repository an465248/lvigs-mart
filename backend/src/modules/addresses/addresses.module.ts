import { Module } from "@nestjs/common";
import { AddressesController } from "./addresses.controller";
import { AddressesService } from "./addresses.service";
import { LocationController } from "./location.controller";
import { PincodeLookupService } from "./pincode-lookup.service";

@Module({
  controllers: [AddressesController, LocationController],
  providers: [AddressesService, PincodeLookupService],
  exports: [AddressesService, PincodeLookupService],
})
export class AddressesModule {}
