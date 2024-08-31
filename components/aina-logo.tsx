import React from 'react'
import Image from "next/image";
import AiLogo from "../public/avatars/ainaglam_logo.svg"

const AinaglamLogo = () => {
  return (
    <div className="flex items-start gap-4">
      <Image
        src={AiLogo}
        alt="logo"
        width={250}
        height={100}
      />
    </div>
  )
}


export default AinaglamLogo