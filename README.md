```mermaid
graph TD
    %% === User Roles ===
    GC([General Contractor 👷])
    SUP([Supplier 🏭])

    %% === System Boundary ===
    subgraph System [🌐 VITA Platform]
        direction TB

        %% === Level 1 - Core Screens ===
        SCR1([🏠 Homepage])
        SCR2([🔐 Login / Register])
        SCR3([📦 Orders Dashboard])
        SCR4([🔎 Supplier Directory])
        SCR5([💬 Messaging ])
        SCR6([👤 Profile ])
        SCR7([🔔 Notifications ])
        SCR8([📊 Reports])
        SCR9([💳 Payments])
        SCR10([📰 Blog])
        SCR11([🏗️ Projects Dashboard])

        %% === Level 2 - Subscreens / Components ===
        subgraph Subscreens [ ]
            direction TB
            SUB1([🧾 Order Details ])
            SUB2([📝 New Order Form ])
            SUB3([📬 Message Thread ])
            SUB4([⚙️ Edit Profile ])
            SUB5([🏗️ Supplier Details ])
            SUB6([📋 Project Details])
            SUB7([🔩 Manage Materials])
        end
    end

    %% === Connections (Hierarchy) ===
    GC --> SCR2
    GC --> SCR3
    GC --> SCR4
    GC --> SCR5
    GC --> SCR6
    GC --> SCR7
    GC --> SCR8
    GC --> SCR9
    GC --> SCR10
    GC --> SCR11

    SUP --> SCR2
    SUP --> SCR3
    SUP --> SCR4
    SUP --> SCR5
    SUP --> SCR6
    SUP --> SCR7
    SUP --> SCR9

    SCR3 --> SUB1
    SCR3 --> SUB2
    SCR5 --> SUB3
    SCR6 --> SUB4
    SCR4 --> SUB5
    SCR11 --> SUB6
    SCR6 --> SUB7
