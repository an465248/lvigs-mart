import { Controller, Get, Param, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { PincodeLookupService } from "./pincode-lookup.service";

@ApiTags("Location")
@Controller("location")
export class LocationController {
  constructor(private pincodeLookup: PincodeLookupService) {}

  @Get("pincode/:pincode")
  @ApiOperation({ summary: "Lookup Indian PIN code to get city/district/state" })
  async lookupPincode(
    @Param("pincode") pincode: string,
  ) {
    return this.pincodeLookup.lookup(pincode);
  }
}
