import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { AddressesService } from "./addresses.service";
import { PincodeLookupService } from "./pincode-lookup.service";

@ApiTags("Addresses")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("addresses")
export class AddressesController {
  constructor(
    private addresses: AddressesService,
    private pincodeLookup: PincodeLookupService,
  ) {}

  @Get()
  async list(@Req() req: any) {
    return this.addresses.list(req.user.id);
  }

  @Post()
  async add(@Req() req: any, @Body() data: any) {
    return this.addresses.add(req.user.id, data);
  }

  @Put(":id")
  async update(@Req() req: any, @Param("id") id: string, @Body() data: any) {
    return this.addresses.update(req.user.id, id, data);
  }

  @Delete(":id")
  async remove(@Req() req: any, @Param("id") id: string) {
    return this.addresses.remove(req.user.id, id);
  }

  @Get("pincode/:pincode")
  @ApiOperation({ summary: "Lookup PIN code for city/state auto-fill" })
  async checkPincode(@Param("pincode") pincode: string) {
    return this.pincodeLookup.lookup(pincode);
  }
}
