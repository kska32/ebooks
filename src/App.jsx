import { useState, useEffect, useCallback } from 'react';
import './App.css';
import JSZip from 'jszip';
import {bookListDB} from './localdb';
import styled,{keyframes,css} from "styled-components";
import { Input, Button, Icon } from 'semantic-ui-react'



const AppWrapper = styled.div`
  position: relative;
  margin: auto;
  display: flex;
  flex-flow: column nowrap;
  transition: all 1s;

  h2{
    font-size: 24px;
    font-weight: 700;
    font-style: italic !important;
  }

`;


const InputBox = styled.div`
  position: relative;
  display: flex;
  flex-flow: row nowrap;
  gap: 4px;
  font-size: 16px;

  >div.input{
    flex: 1;
  }

  >button{
    width: 50px;
  }
`;


const BookList = styled.div`
  position: relative;
  display: flex;
  flex-flow: column nowrap;

  border-radius: 4px;
  gap: 20px;

  &.hasMarginTop{
    margin-top: 20px;
  }

  >div.item{
    position: relative;

    display: flex;
    flex-flow: row nowrap;
    justify-content: space-between;
    border-radius: 5px;
    padding: 12px 14px;

    font-size: 16px;
    font-weight: 700;

    word-break: break-word;
    background-color: rgba(0,0,0,0.068);
    gap: 10px;

    >span{
      text-align: left;

      >span{
        &.size{
          position: relative;
          background-color: rgba(0,0,0,0.3);
          color: #fff;
          border-radius: 5px;
          font-size: 12px;
          padding: 2px 5px;
          margin-left: 10px;
          user-select: none;
        }
      }
    }

    &:hover{
      background-color: rgba(255,255,0,0.08);
      box-shadow: 0px 0px 0px 1px rgba(0,0,0,0.25);
    }
  }
`;

const Loading = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 999;

  display: flex;
  justify-content: center;
  align-items: center;
 
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.3);
  color: #fff;
  font-size: 32px;
  font-weight: bold;

  opacity: 0;
  pointer-events: none;
  transition: all 0.18s;

  &.loading{
    opacity: 1;
  }
`;



function App() {
  const [count, setCount] = useState(0);
  const [isReady, setReady] = useState(false);
  const [booklist, setBooklist] = useState([]);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    const zip = new JSZip();
    fetch('/ebook-list.json.zip').then((res) => res.arrayBuffer()).then((abb) => {
        const oldSize = +localStorage.getItem('size');
        return bookListDB.count().then((count)=>{
            if(oldSize !== +abb.byteLength || count === 0) {
                localStorage.setItem('size', abb.byteLength);
                return zip.loadAsync(abb).then((z)=>{
                    return z.file('ebook-list.json').async('string').then((data)=>{
                        const jsonData = JSON.parse(data);
                        return bookListDB.putAll(jsonData).then((res)=>true);
                    });
                });
            }
            return true;
        });
    }).then(setReady).catch((err)=>{
        console.error('Error:', err);
    });
  }, []);


  const search = useCallback((v)=>{
    const keyword = v?.trim()??'';
    if(keyword === '') return;
    setLoading(true);
    bookListDB.search(keyword)
      .then(setBooklist)
      .catch(console.error).finally(()=>{
        setLoading(false);
      });
  }, []);


  return <AppWrapper>
      <InputBox>
        <Input fluid placeholder='目录搜索...' 
            size='large'
            value={value} 
            onChange={(e)=>setValue(e.target.value)} 
            onKeyUp={e=>e.keyCode===13 && search(value)} 
            icon='search'
        />
      </InputBox>
      <BookList className={booklist.length>0 ? 'hasMarginTop' : ''}>
        {
          booklist.map((v,i)=>{
            return <div className='item' key={v.id} >
              <span>
                  <span className='name'>{v.name}</span>
                  <span className='size'>{Number(v.size / 1024**2).toFixed(2)} MB</span>
              </span>
              <a href={v.webViewLink} target='_blank'><Icon name='download' color='grey' /></a>
            </div>
          })
        }
      </BookList>
      <Loading className={loading ? 'loading' : ''}>
        Loading...
      </Loading>
  </AppWrapper>
  
}

export default App
