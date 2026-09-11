<template>
    <div class="image_container energon_glow_general">
        <img class='icon icon_abs' src="@/assets/images/hud/cube_energon_grid_backward.svg" />
        <img class='icon icon_abs energon_glow_core'
            src="@/assets/images/hud/cube_energon_core.svg" />
        <img class='icon icon_abs energon_glow_grid'
            src="@/assets/images/hud/cube_energon_grid_frontal.svg" />
    </div>
</template>


<script setup>
    
</script>


<style lang='scss' scoped>
    @use "@/styles/typography" as *;
    @use "@/styles/colors" as *;

    .image_container {
        width: 100%;
        height: 100%;
    }
    // .image_container {
    //     position: relative;
    //     width: 8.889vh;
    //     height: 8.889vh;

    //     @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
    //         width: 8.889vh;
    //         height: 8.889vh;
    //     }
    //     // позже расчитать:
    //     // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
    //     //     width: 8.889vh;
    //     //     height: 8.889vh;
    //     // }  
    //     @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
    //         width: 3.333vw;
    //         height: 3.333vw;
    //     }
    //     @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
    //         width: 3.438vw;
    //         height: 3.438vw;
    //     }
    // }

    .icon {
        width: 100%;
        height: auto;
    }

    .icon_abs {
        position: absolute;
        inset: 0;
    }

    .energon_glow_general {
        filter: drop-shadow(0 0 0.44rem rgb(43, 157, 229));
    }

    .energon_glow_grid {
        filter: drop-shadow(0 0 1.25rem rgb(20, 212, 255));
    }

    .energon_glow_core {
        filter: drop-shadow(0 0 0.625rem rgb(20, 212, 255));
    }
</style>