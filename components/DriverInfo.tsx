import { Modal, Pressable, View } from "react-native";

import Ionicons from "@/components/Icon";
import Vehicle, { VehicleKind } from "@/components/Vehicle";
import { Button, Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { maskPlate, roundTrips, shortName } from "@/lib/privacy";

type D = { name: string; rating: number; trips: number; vehicle: string; plate: string };

const Line = ({ icon, label, value }: { icon: any; label: string; value: string }) => (
  <Row style={{ gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
    <Ionicons name={icon} size={22} />
    <T style={{ flex: 1, color: colors.muted }}>{label}</T>
    <T style={{ fontFamily: font.bold }}>{value}</T>
  </Row>
);

/** What the rider can see about the driver after a trip. Phone number, address and location are never shown. */
const DriverInfo = ({ visible, driver, kind, onClose }: { visible: boolean; driver: D | null; kind: VehicleKind; onClose: () => void }) => (
  <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
    <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
      <Pressable style={{ backgroundColor: colors.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, paddingBottom: 30 }}>
        {driver && (
          <>
            <Row style={{ gap: 14 }}>
              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" }}>
                <T style={{ color: colors.onInk, fontFamily: font.extra, fontSize: 24 }}>{driver.name[0]}</T>
              </View>
              <View style={{ flex: 1 }}>
                <T style={{ fontFamily: font.extra, fontSize: 22 }}>{shortName(driver.name)}</T>
                <Row style={{ gap: 4 }}>
                  <Ionicons name="star" size={14} />
                  <T style={{ fontFamily: font.semi }}>{driver.rating}</T>
                </Row>
              </View>
              <Vehicle kind={kind} size={64} />
            </Row>
            <View style={{ marginTop: 14 }}>
              <Line icon="car-outline" label="Vehicle" value={driver.vehicle} />
              <Line icon="card-outline" label="Number plate" value={maskPlate(driver.plate)} />
              <Line icon="ribbon-outline" label="Trips on Routiq" value={roundTrips(driver.trips)} />
              <Line icon="shield-checkmark-outline" label="Identity and documents" value="Verified" />
            </View>
            <Row style={{ gap: 10, backgroundColor: colors.card, borderRadius: 14, padding: 14, marginTop: 14, alignItems: "flex-start" }}>
              <Ionicons name="lock-closed-outline" size={18} />
              <T style={{ flex: 1, color: colors.muted, fontSize: 13, lineHeight: 19 }}>To protect your driver's privacy we show only their first name, part of the plate and no phone number or address. If you left something behind, ask Help to contact them for you.</T>
            </Row>
            <Button title="Close" variant="grey" onPress={onClose} style={{ marginTop: 14 }} />
          </>
        )}
      </Pressable>
    </Pressable>
  </Modal>
);

export default DriverInfo;
