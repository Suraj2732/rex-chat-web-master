import { Users, UserPlus, UsersRound } from "lucide-react";


const icons: any = {
    group: Users,
    person: UserPlus,
    community: UsersRound
};
interface QuickActionItemProps {
    title: string;
    icon: keyof typeof icons; // "group" | "person" | "community"
    handleOnClick: () => void;
  }
  
  

export default function QuickActionItem({ title, icon,handleOnClick }: QuickActionItemProps) {
    const Icon = icons[icon];


    return (
        <div className="flex items-center gap-4 px-3 py-3 hover:bg-[#202c33] rounded-lg cursor-pointer"
        onClick={handleOnClick}

        >
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-black">
                <Icon />
            </div>
            <p className="font-medium">{title}</p>
        </div>
    );
}