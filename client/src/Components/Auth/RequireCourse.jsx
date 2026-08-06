import { Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { needsCourse } from "@/lib/roles";
import ChooseCourseGate from "@/Components/App/ChooseCourseGate";

// Layout guard for content routes: a signed-in student who hasn't joined any
// batch is shown the "choose a course" gate instead of the (empty) content.
// Staff and enrolled students pass straight through. Sits INSIDE the app shell,
// so the gate renders with the normal sidebar/topbar.
export default function RequireCourse() {
    const { user } = useAuth();
    if (needsCourse(user)) return <ChooseCourseGate />;
    return <Outlet />;
}
