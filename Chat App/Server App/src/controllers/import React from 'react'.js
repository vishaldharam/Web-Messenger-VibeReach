import React from 'react'
import { useAuth } from '../../context/AuthContext'
import PropTypes from 'prop-types';


const UserChat = ({ allUsers, localSearchQuery, setLocalSearchQuery, addNewChat, chats }) => {
    

    
     
  return (
    <div className='bg-slate-100 shadow-md  justify-center rounded-md w-[30%]'>
    <div><div className=' w-full  py-2 px-3 items-center '>
        <svg className="w-4 h-4 absolute m-3 text-gray-500"  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
        </svg>
        <input type="text" placeholder='Find your match here ....' value={localSearchQuery} onChange={(e)=> setLocalSearchQuery(e.target.value.toLocaleLowerCase())} className='text-sm w-full py-2 rounded-md border pl-10' />
        
    </div>
    <div className=' w-full pb-1 px-4 items-center border-b flex'>
        <div className='w-[80%] left-0 cursor-pointer'><span className='  text-[10px] font-semibold text-sky-950'>New AI Chat</span> </div>
        
        <div className='right-0 cursor-pointer'><span className='right-0 text-[10px] font-semibold text-sky-950'>New Group</span>  </div>


    </div></div>
    <div className='overflow-y-scroll  px-1  no-scrollbar'>
       {[...allUsers].filter((user)=> 
       localSearchQuery ?
       user?.name?.toLocaleLowerCase().includes(localSearchQuery) || user?.phone?.toLocaleLowerCase().includes(localSearchQuery)

       : true).map((index) =>{
    return  (
        <div key={index + Math.random(Math.random() * 10)} className=' bg-white hover:bg-sky-50 cursor-pointer flex w-full px-3 shadow-md border-b'>
    <div className='justify-center items-center w-[16%] rounded-full  py-2 '>
        <img className='rounded-full' src="profile.jpg" alt="" />
    </div>
    <div className='w-[70%] min-h-10 px-3 py-2 items-center'>
        <div className='pt-1 font-medium text-sm text-slate-600' >{index.name}</div>
       <div className=' rounded-md px-1  font-medium text-[11px] text-slate-400' >{index.about}</div>

    </div>

    <div className='w-[18%]  mt-4 mr-1 items-center rounded-full'>
       {/* { <div className=' w-full mt-3  text-sm  rounded-full px-[10px] justify-center '><span className='  bg-sky-600 rounded-full text-[12px] text-white px-[7px] py-[2px]  m-0'>3</span></div>} */}
        <button className='px-2 text-[12px] rounded-md  text-white  py-1 bg-sky-600' onClick={()=> addNewChat(index._id)}>Reach </button>
        </div>

    </div>
    )
    
   }) 
 }</div> 
    <div className='overflow-y-scroll px-1  no-scrollbar'>
       {[...allUsers].filter((user)=> 
       localSearchQuery ?
       user?.name?.toLocaleLowerCase().includes(localSearchQuery) || user?.phone?.toLocaleLowerCase().includes(localSearchQuery)

       : true).map((index) =>{
    return  (
        <div key={index + Math.random(Math.random() * 10)} className=' bg-white hover:bg-sky-50 cursor-pointer flex w-full px-3 shadow-md border-b'>
    <div className='justify-center items-center w-[16%] rounded-full  py-2 '>
        <img className='rounded-full' src="profile.jpg" alt="" />
    </div>
    <div className='w-[70%] min-h-10 px-3 py-2 items-center'>
        <div className='pt-1 font-medium text-sm text-slate-600' >{index.name}</div>
       <div className=' rounded-md px-1  font-medium text-[11px] text-slate-400' >{index.about}</div>

    </div>

    <div className='w-[18%]  mt-4 mr-1 items-center rounded-full'>
       {/* { <div className=' w-full mt-3  text-sm  rounded-full px-[10px] justify-center '><span className='  bg-sky-600 rounded-full text-[12px] text-white px-[7px] py-[2px]  m-0'>3</span></div>} */}
        <button className='px-2 text-[12px] rounded-md  text-white  py-1 bg-sky-600' onClick={()=> addNewChat(index._id)}>Reach </button>
        </div>

    </div>
    )
    
   }) 
 }</div> 
   



</div>
  )
}

export default UserChat

UserChat.propTypes = {
    allUsers: PropTypes.node.isRequired,
    };s