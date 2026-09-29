import type { SVGProps } from "react";
import {
  CalendarCheckIcon,
  GridIcon,
  HomeIcon,
  MessageIcon,
  UserCheckIcon,
  UsersIcon,
} from "@/components/ui/icons";
import type { AdminSectionId } from "@/lib/admin/navigation";

const ICONS = {
  dashboard: GridIcon,
  properties: HomeIcon,
  agents: UserCheckIcon,
  bookings: CalendarCheckIcon,
  "contact-requests": MessageIcon,
  users: UsersIcon,
} satisfies Record<AdminSectionId, (props: SVGProps<SVGSVGElement>) => React.JSX.Element>;

/** The icon for an admin section, shared by the sidebar and the dashboard cards. */
export function AdminSectionIcon({ id, ...props }: { id: AdminSectionId } & SVGProps<SVGSVGElement>) {
  const Icon = ICONS[id];
  return <Icon {...props} />;
}
